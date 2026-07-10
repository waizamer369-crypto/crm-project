import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/chat?projectId=xxx
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 })
  }

  try {
    let chat = await prisma.projectChat.findUnique({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                employeeCard: { select: { fullName: true } }
              }
            }
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                employeeCard: { select: { fullName: true, jobTitle: true } }
              }
            }
          }
        }
      }
    })

    // Auto-create the chat if it doesn't exist yet (e.g. project created before chat existed)
    if (!chat) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } }
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      const allMemberIds = [project.ownerId, ...project.members.map(m => m.userId)]

      chat = await prisma.projectChat.create({
        data: {
          projectId,
          members: { create: allMemberIds.map((userId: string) => ({ userId })) }
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  employeeCard: { select: { fullName: true } }
                }
              }
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  employeeCard: { select: { fullName: true, jobTitle: true } }
                }
              }
            }
          }
        }
      })
    }

    const isMember = chat.members.some(m => m.userId === session.user.id)
    const isOwner = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id }
    })

    if (!isMember && !isOwner && session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Not a chat member" }, { status: 403 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("GET /api/chat error:", error)
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 })
  }
}

// POST /api/chat  { projectId, content }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { projectId, content } = await req.json()

    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: "Project ID and content required" }, { status: 400 })
    }

    let chat = await prisma.projectChat.findUnique({
      where: { projectId },
      include: { members: true }
    })

    if (!chat) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } }
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      const allMemberIds = [project.ownerId, ...project.members.map(m => m.userId)]

      chat = await prisma.projectChat.create({
        data: {
          projectId,
          members: { create: allMemberIds.map((userId: string) => ({ userId })) }
        },
        include: { members: true }
      })
    }

    const isMember = chat.members.some(m => m.userId === session.user.id)
    const isOwner = await prisma.project.findFirst({
      where: { id: projectId, ownerId: session.user.id }
    })

    if (!isMember && !isOwner && session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Not a chat member" }, { status: 403 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: session.user.id,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCard: { select: { fullName: true } }
          }
        }
      }
    })

    // Notify other chat members (best-effort, doesn't fail the send if this fails)
    const otherMembers = chat.members.filter(m => m.userId !== session.user.id)
    for (const member of otherMembers) {
      try {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            title: "New Chat Message",
            message: `${message.sender.employeeCard?.fullName || message.sender.name || "Someone"}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
            read: false,
            link: `/projects/${projectId}`
          }
        })
      } catch (e) {
        console.error("Notification failed:", e)
      }
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("POST /api/chat error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}