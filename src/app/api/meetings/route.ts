import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { endStaleEmptyMeetings } from "@/lib/meetings"

// GET /api/meetings — list meetings (scheduled + live), most relevant first
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await endStaleEmptyMeetings()

    const meetings = await prisma.meeting.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE"] } },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: {
          where: { leftAt: null },
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: [{ status: "asc" }, { scheduledFor: "asc" }, { createdAt: "desc" }]
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("GET meetings error:", error)
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
  }
}

// POST /api/meetings — create a meeting (instant or scheduled)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, scheduledFor } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const isInstant = !scheduledFor

    const meeting = await prisma.meeting.create({
      data: {
        title: title.trim(),
        createdById: session.user.id,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: isInstant ? "LIVE" : "SCHEDULED"
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: true
      }
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("POST meeting error:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}