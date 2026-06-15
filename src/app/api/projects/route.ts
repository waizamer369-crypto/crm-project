import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: session.user.role === "EMPLOYER" 
      ? { ownerId: session.user.id }
      : { members: { some: { userId: session.user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: { include: { assignee: { select: { id: true, name: true } } } },
      _count: { select: { tasks: true, members: true } }
    },
    orderBy: { deadline: "asc" }
  })

  return NextResponse.json(projects)
}

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

  return NextResponse.json(project, { status: 201 })
}

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

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    })

    let isNewUser = false

    if (!user) {
      // Create a new user with temporary password
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

      // Create employee card for new user
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

    // Check if already a member
    const existingMember = project.members.find(m => m.userId === user.id)
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 })
    }

    // Add member to project
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