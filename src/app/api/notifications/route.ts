import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET - Fetch all notifications for current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })
    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST - Mark notifications as read
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    
    // If id provided, mark single as read
    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.user.id },
        data: { read: true }
      })
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true }
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}