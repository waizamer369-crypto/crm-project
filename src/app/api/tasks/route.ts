import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch all tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    let where: any = {}
    if (projectId) where.projectId = projectId
    if (session.user.role === "EMPLOYEE") {
      where.assigneeId = session.user.id
    }

    const task = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      },
      orderBy: { deadline: "asc" }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("GET tasks error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

// POST - Create new task (employer only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized - Employer only" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, deadline, priority, projectId, assigneeEmail } = body

    if (!title || !deadline || !projectId || !assigneeEmail) {
      return NextResponse.json(
        { error: `Missing: ${!title ? "title " : ""}${!deadline ? "deadline " : ""}${!projectId ? "projectId " : ""}${!assigneeEmail ? "assigneeEmail" : ""}` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: assigneeEmail },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: "No employee found with this email. Add them first." }, { status: 400 })
    }

    const projectExists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!projectExists) {
      return NextResponse.json({ error: "Project not found" }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        deadline: new Date(deadline),
        priority: priority || "MEDIUM",
        status: "TODO",
        projectId,
        assigneeId: user.id,
        creatorId: session.user.id
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("POST task error:", error)
    return NextResponse.json({ 
      error: "Failed to create task",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PATCH - Update task status (employer: any task/any status; employee: own tasks, no OVERDUE)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { taskId, status } = body

    if (!taskId || !status) {
      return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 })
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Employees can only update their own tasks and cannot set OVERDUE
    if (session.user.role === "EMPLOYEE") {
      if (status === "OVERDUE") {
        return NextResponse.json({ error: "Employees cannot set tasks as overdue" }, { status: 403 })
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assigneeId: true }
      })

      if (!task || task.assigneeId !== session.user.id) {
        return NextResponse.json({ error: "You can only update your own tasks" }, { status: 403 })
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("PATCH task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

// DELETE - Delete a task (employer only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized - Employer only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE task error:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}