import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const employer = await prisma.user.create({
      data: {
        email: 'employer@company.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'EMPLOYER',
        employeeCard: {
          create: {
            fullName: 'Admin Employer',
            jobTitle: 'CEO',
            email: 'employer@company.com',
            status: 'ACTIVE',
            starRating: 5.0
          }
        }
      }
    })

    await prisma.user.create({
      data: {
        email: 'john@company.com',
        password: hashedPassword,
        name: 'John',
        role: 'EMPLOYEE',
        employeeCard: {
          create: {
            fullName: 'John Doe',
            jobTitle: 'Developer',
            email: 'john@company.com',
            status: 'ACTIVE',
            starRating: 3.0
          }
        }
      }
    })

    await prisma.companySettings.create({
      data: {
        employerId: employer.id,
        earlyThresholdHours: 24,
        starsCompletedEarly: 5,
        starsCompletedOnTime: 3,
        starsCompletedLate: 1
      }
    })

    return NextResponse.json({ success: true, message: 'Seeded successfully!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}