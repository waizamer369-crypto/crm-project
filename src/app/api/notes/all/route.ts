import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notes/all — Employer only: view every user's notes
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized - Employer only" }, { status: 403 })
  }

  try {
    const notes = await prisma.note.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCard: { select: { fullName: true, jobTitle: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("GET all notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}