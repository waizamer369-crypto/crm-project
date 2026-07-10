import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/meetings/:id/signal — poll for signals addressed to me, then consume (delete) them
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const signals = await prisma.meetingSignal.findMany({
      where: { meetingId: params.id, toUserId: session.user.id },
      orderBy: { createdAt: "asc" }
    })

    if (signals.length > 0) {
      await prisma.meetingSignal.deleteMany({
        where: { id: { in: signals.map(s => s.id) } }
      })
    }

    return NextResponse.json(signals.map(s => ({
      id: s.id,
      fromUserId: s.fromUserId,
      type: s.type,
      payload: JSON.parse(s.payload)
    })))
  } catch (error) {
    console.error("Poll signal error:", error)
    return NextResponse.json({ error: "Failed to poll signals" }, { status: 500 })
  }
}

// POST /api/meetings/:id/signal — send a signal to another participant
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { toUserId, type, payload } = await req.json()

    if (!toUserId || !type) {
      return NextResponse.json({ error: "toUserId and type are required" }, { status: 400 })
    }

    await prisma.meetingSignal.create({
      data: {
        meetingId: params.id,
        fromUserId: session.user.id,
        toUserId,
        type,
        payload: JSON.stringify(payload || {})
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send signal error:", error)
    return NextResponse.json({ error: "Failed to send signal" }, { status: 500 })
  }
}