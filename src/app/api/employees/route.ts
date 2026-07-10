import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (resend) return resend
  if (!process.env.RESEND_API_KEY) return null
  resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

// GET - Fetch all employees
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const employees = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "EMPLOYER"] } },
      include: {
        employeeCard: true,
        projects: {
          include: {
            project: { select: { name: true } }
          }
        }
      }
    })

    return NextResponse.json(employees.map(emp => ({
      id: emp.id,
      fullName: emp.employeeCard?.fullName || emp.name,
      jobTitle: emp.employeeCard?.jobTitle || "",
      phoneNumber: emp.employeeCard?.phoneNumber,
      email: emp.email,
      starRating: emp.employeeCard?.starRating || 0,
      status: emp.employeeCard?.status || "ACTIVE",
      activeProjects: emp.projects
    })))
  } catch (error) {
    console.error("GET employees error:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

// POST - Create new employee + send welcome email
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized - Employer only" }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, name, fullName, jobTitle, phoneNumber, role, status, workingHoursPerDay } = body

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || fullName,
        role: role || "EMPLOYEE",
        employeeCard: {
          create: {
            fullName,
            jobTitle: jobTitle || "",
            phoneNumber: phoneNumber || "",
            email,
            status: status || "ACTIVE",
            workingHoursPerDay: workingHoursPerDay || 8
          }
        }
      },
      include: { employeeCard: true }
    })

    const crmUrl = process.env.NEXTAUTH_URL || "https://crm-production-5052.up.railway.app"
    const loginUrl = `${crmUrl}/login`
    const profileUrl = `${crmUrl}/employee/profile`

    try {
      if (process.env.RESEND_API_KEY) {
        const resendClient = getResend()
        if (resendClient) {
        await resendClient.emails.send({
          from: "CRM Pro <onboarding@resend.dev>",
          to: email,
          subject: "Welcome to CRM Pro - Your Account Details",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to CRM Pro!</h2>
              <p>Hi ${fullName},</p>
              <p>Your employer has created an account for you. Here are your login details:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Role:</strong> ${role || "EMPLOYEE"}</p>
              </div>
              <div style="margin: 20px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Login to CRM Pro
                </a>
              </div>
              <p>After logging in, you can view your profile here:</p>
              <a href="${profileUrl}" style="color: #2563eb;">My Profile</a>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
              <p style="color: #64748b; font-size: 12px;">If you have any questions, contact your employer.</p>
            </div>
          `
        })
        }
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      fullName: user.employeeCard?.fullName,
      jobTitle: user.employeeCard?.jobTitle,
      role: user.role,
      message: "Employee created successfully. Welcome email sent."
    })
  } catch (error) {
    console.error("POST employee error:", error)
    return NextResponse.json({
      error: "Failed to create employee",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE - Remove an employee (employer only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized - Employer only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get("id")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (employeeId === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    // Delete related data first then the user
    await prisma.user.delete({ where: { id: employeeId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE employee error:", error)
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 })
  }
}