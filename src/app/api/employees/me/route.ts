import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const employeeCard = await prisma.employeeCard.findUnique({
    where: { userId: session.user.id },
    include: {
      activeProjects: {
        include: { project: { select: { id: true, name: true } } }
      },
      starHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          givenBy: { select: { name: true } }
        }
      }
    }
  })

  if (!employeeCard) {
    return NextResponse.json({ error: "Employee card not found" }, { status: 404 })
  }

  return NextResponse.json(employeeCard)
}