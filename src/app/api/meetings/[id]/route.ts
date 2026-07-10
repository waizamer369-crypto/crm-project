import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { endStaleEmptyMeetings } from "@/lib/meetings"

// GET /api/meetings/:id — meeting detail + current active participants
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await endStaleEmptyMeetings(params.id)

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: {
          where: { leftAt: null },
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("GET meeting error:", error)
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 })
  }
}

// DELETE /api/meetings/:id — end the meeting (creator only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: params.id } })
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }
    if (meeting.createdById !== session.user.id) {
      return NextResponse.json({ error: "Only the host can end this meeting" }, { status: 403 })
    }

    await prisma.meeting.update({
      where: { id: params.id },
      data: { status: "ENDED" }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE meeting error:", error)
    return NextResponse.json({ error: "Failed to end meeting" }, { status: 500 })
  }
}