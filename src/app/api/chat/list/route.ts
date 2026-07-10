import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/chat/list
// Employer -> every project. Employee -> only projects they are a member of.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const isEmployer = session.user.role === "EMPLOYER"

    const projects = await prisma.project.findMany({
      where: isEmployer
        ? {}
        : { members: { some: { userId: session.user.id } } },
      select: {
        id: true,
        name: true,
        status: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("GET chat list error:", error)
    return NextResponse.json({ error: "Failed to load chats" }, { status: 500 })
  }
}