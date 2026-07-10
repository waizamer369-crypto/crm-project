import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch all notes for the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" }
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error("GET notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

// POST - Create a new note
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, content } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || "",
        userId: session.user.id
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("POST note error:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

// PATCH - Update an existing note
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, title, content } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content

    const note = await prisma.note.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("PATCH note error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

// DELETE - Delete a note
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}