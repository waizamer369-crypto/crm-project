import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/meetings/:id/leave
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.meetingParticipant.updateMany({
      where: { meetingId: params.id, userId: session.user.id, leftAt: null },
      data: { leftAt: new Date() }
    })

    // Notify remaining participants so they can close their peer connection.
    // (Ending the meeting itself is handled lazily by endStaleEmptyMeetings —
    // doing it instantly here caused a race with quick rejoin-on-load in dev.)
    const remaining = await prisma.meetingParticipant.findMany({
      where: { meetingId: params.id, leftAt: null }
    })

    if (remaining.length > 0) {
      await prisma.meetingSignal.createMany({
        data: remaining.map(p => ({
          meetingId: params.id,
          fromUserId: session.user.id,
          toUserId: p.userId,
          type: "leave",
          payload: "{}"
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leave meeting error:", error)
    return NextResponse.json({ error: "Failed to leave meeting" }, { status: 500 })
  }
}