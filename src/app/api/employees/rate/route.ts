import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { employeeId, starChange, reason, description } = body

    if (!employeeId || starChange === undefined || !reason || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const employeeCard = await prisma.employeeCard.findUnique({
      where: { userId: employeeId }
    })

    if (!employeeCard) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const newRating = Math.max(1, Math.min(5, employeeCard.starRating + starChange))

    await prisma.employeeCard.update({
      where: { userId: employeeId },
      data: { starRating: newRating }
    })

    await prisma.starHistory.create({
      data: {
        employeeCardId: employeeCard.id,
        changeAmount: starChange,
        reason,
        description,
        givenById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      newRating,
      message: "Rating submitted successfully"
    })
  } catch (error) {
    console.error("Rate employee error:", error)
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 })
  }
}