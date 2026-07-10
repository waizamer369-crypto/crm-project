import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/projects — List all projects for the current user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: { userId: session.user.id }
            }
          }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("GET /api/projects error:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

// POST /api/projects — Create a new project
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json()

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      deadline: new Date(body.deadline),
      ownerId: session.user.id,
      members: {
        create: body.memberIds?.map((id: string) => ({ userId: id })) || []
      }
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } }
    }
  })

  // AUTO-CREATE CHAT for this project
  try {
    const allMemberIds = [
      session.user.id,
      ...(body.memberIds || [])
    ]

    await prisma.projectChat.create({
      data: {
        projectId: project.id,
        members: {
          create: allMemberIds.map((userId: string) => ({ userId }))
        }
      }
    })
  } catch (chatError) {
    console.error("Failed to create project chat:", chatError)
  }

  return NextResponse.json(project, { status: 201 })
}

// PUT /api/projects — Update project status
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json()
  const { projectId, status } = body

  if (!projectId || !status) {
    return NextResponse.json({ error: "Project ID and status required" }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { status }
  })

  return NextResponse.json(updated)
}

// PATCH /api/projects — Add member to project
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { projectId, email, role } = body

    if (!projectId || !email) {
      return NextResponse.json({ error: "Project ID and email are required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    let user = await prisma.user.findUnique({
      where: { email }
    })

    let isNewUser = false

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: email.split("@")[0],
          role: "EMPLOYEE"
        }
      })

      await prisma.employeeCard.create({
        data: {
          userId: user.id,
          fullName: email.split("@")[0],
          jobTitle: "Team Member",
          email,
          status: "ACTIVE",
          starRating: 3.0
        }
      })

      isNewUser = true
    }

    const existingMember = project.members.find(m => m.userId === user.id)
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 })
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: role || "MEMBER"
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    })

    // AUTO-ADD NEW MEMBER TO PROJECT CHAT
    try {
      const chat = await prisma.projectChat.findUnique({
        where: { projectId }
      })

      if (chat) {
        await prisma.chatMember.create({
          data: {
            chatId: chat.id,
            userId: user.id,
            addedById: session.user.id
          }
        })
      }
    } catch (chatError) {
      console.error("Failed to add member to chat:", chatError)
    }

    return NextResponse.json({
      success: true,
      member,
      isNewUser,
      message: isNewUser 
        ? `Invitation sent to ${email}. A new account was created with a temporary password.`
        : `${email} was added to the project.`
    })
  } catch (error) {
    console.error("PATCH /api/projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
// DELETE /api/projects — Delete a project
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the project owner can delete this project" }, { status: 403 })
    }

    // Delete related records first, then the project
    await prisma.$transaction([
      prisma.chatMessage.deleteMany({
        where: { chat: { projectId } }
      }),
      prisma.chatMember.deleteMany({
        where: { chat: { projectId } }
      }),
      prisma.projectChat.deleteMany({
        where: { projectId }
      }),
      prisma.projectMember.deleteMany({
        where: { projectId }
      }),
      prisma.project.delete({
        where: { id: projectId }
      })
    ])

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/projects error:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}