import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// POST /api/projects/[id]/chat/members - Add member
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId } = await req.json()

    // Check if requester is project owner or employer
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { owner: true }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.ownerId === session.user.id
    const isEmployer = session.user.role === "EMPLOYER"

    if (!isOwner && !isEmployer) {
      return NextResponse.json({ error: "Only project owner can add members" }, { status: 403 })
    }

    // Get or create chat
    let chat = await prisma.projectChat.findUnique({
      where: { projectId: params.id }
    })

    if (!chat) {
      chat = await prisma.projectChat.create({
        data: { projectId: params.id }
      })
    }

    // Check if user is already a project member
    const isProjectMember = await prisma.projectMember.findFirst({
      where: { projectId: params.id, userId }
    })

    if (!isProjectMember) {
      return NextResponse.json({ error: "User must be a project member first" }, { status: 400 })
    }

    // Add to chat
    const member = await prisma.chatMember.create({
      data: {
        chatId: chat.id,
        userId,
        addedById: session.user.id
      },
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
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error("Add member error:", error)
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/chat/members - Remove member
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId } = await req.json()

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.ownerId === session.user.id
    const isEmployer = session.user.role === "EMPLOYER"
    const isSelf = userId === session.user.id

    if (!isOwner && !isEmployer && !isSelf) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const chat = await prisma.projectChat.findUnique({
      where: { projectId: params.id }
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    await prisma.chatMember.deleteMany({
      where: { chatId: chat.id, userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}