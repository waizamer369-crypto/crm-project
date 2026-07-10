import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { endStaleEmptyMeetings } from "@/lib/meetings"

// POST /api/meetings/:id/join
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await endStaleEmptyMeetings(params.id)

    const meeting = await prisma.meeting.findUnique({ where: { id: params.id } })
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }
    if (meeting.status === "ENDED") {
      return NextResponse.json({ error: "This meeting has ended" }, { status: 400 })
    }

    // Get existing active participants BEFORE adding self — the joiner initiates offers to these
    const existingParticipants = await prisma.meetingParticipant.findMany({
      where: { meetingId: params.id, leftAt: null, userId: { not: session.user.id } },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    await prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId: params.id, userId: session.user.id } },
      update: { joinedAt: new Date(), leftAt: null },
      create: { meetingId: params.id, userId: session.user.id, joinedAt: new Date() }
    })

    if (meeting.status === "SCHEDULED") {
      await prisma.meeting.update({ where: { id: params.id }, data: { status: "LIVE" } })
    }

    return NextResponse.json({ success: true, existingParticipants })
  } catch (error) {
    console.error("Join meeting error:", error)
    return NextResponse.json({ error: "Failed to join meeting" }, { status: 500 })
  }
}