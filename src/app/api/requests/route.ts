import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { Resend } from "resend"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "users") {
      const users = await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          employeeCard: {
            select: { fullName: true, jobTitle: true }
          }
        }
      })
      return NextResponse.json(users)
    }

    if (type === "notifications") {
      const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20
      })
      return NextResponse.json(notifications)
    }

    const requests = await prisma.request.findMany({
      where: session.user.role === "EMPLOYER" 
        ? {} 
        : { 
            OR: [
              { employeeId: session.user.id },
              { receiverId: session.user.id }
            ]
          },
      include: { 
        employee: { include: { employeeCard: true } },
        receiver: { include: { employeeCard: true } }
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(requests)
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { type, title, description, receiverId } = await req.json()

    if (!receiverId) {
      return NextResponse.json({ error: "Please select who to send to" }, { status: 400 })
    }

    const newRequest = await prisma.request.create({
      data: {
        type,
        title,
        description,
        status: "PENDING",
        employeeId: session.user.id,
        receiverId: receiverId,
      },
    })

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employeeCard: true },
    })

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { employeeCard: true },
    })

    const senderName = sender?.employeeCard?.fullName || sender?.name || "Someone"
    const senderEmail = sender?.email || session.user.email || ""
    const receiverEmail = receiver?.email || ""

    // Create notification for receiver
    let notificationCreated = false
    try {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: `New ${type} Request from ${senderName}`,
          message: `${title}: ${description?.substring(0, 100)}${description?.length > 100 ? '...' : ''}`,
          read: false,
          link: "/requests"
        }
      })
      notificationCreated = true
    } catch (notifError) {
      console.error("Notification failed:", notifError)
    }

    // Send email
    let emailSent = false
    if (receiverEmail && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: "CRM Pro <onboarding@resend.dev>",
          to: [receiverEmail],
          subject: `📧 New ${type} Request from ${senderName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">New Request from ${senderName}</h2>
              <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Description:</strong> ${description}</p>
              <a href="${process.env.NEXTAUTH_URL}/requests" 
                 style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
                View Request
              </a>
            </div>
          `,
        })
        if (!error) emailSent = true
      } catch (emailError) {
        console.error("Email failed:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      notificationCreated,
      emailSent,
      message: notificationCreated 
        ? `✅ Request sent!` 
        : "Request saved but notification failed",
    })
  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, status, response } = await req.json()
    
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { 
        status,
        response: response || null 
      },
      include: { 
        employee: { include: { employeeCard: true } },
        receiver: { include: { employeeCard: true } }
      },
    })

    // Notify sender about status change + response
    if (updatedRequest.employeeId) {
      try {
        const receiverName = updatedRequest.receiver?.employeeCard?.fullName 
          || updatedRequest.receiver?.name 
          || "Someone"
        
        const statusEmoji = status === "APPROVED" ? "✅" : status === "DECLINED" ? "❌" : "📝"
        const message = response 
          ? `"${updatedRequest.title}" has been ${status.toLowerCase()}. Response: ${response}`
          : `"${updatedRequest.title}" has been ${status.toLowerCase()}`

        await prisma.notification.create({
          data: {
            userId: updatedRequest.employeeId,
            title: `${statusEmoji} Request ${status} by ${receiverName}`,
            message: message,
            read: false,
            link: "/requests"
          }
        })
      } catch (notifError) {
        console.error("Status notification failed:", notifError)
      }
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("PATCH error:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}