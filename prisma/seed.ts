import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Try to clean existing data (ignore errors if tables don't exist)
  try {
    await prisma.starHistory.deleteMany()
    await prisma.starLog.deleteMany()
    await prisma.kanbanLog.deleteMany()
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.projectShare.deleteMany()
    await prisma.clientShare.deleteMany()
    await prisma.project.deleteMany()
    await prisma.employeeCard.deleteMany()
    await prisma.companySettings.deleteMany()
    await prisma.user.deleteMany()
  } catch (e) {
    console.log('Some tables may not exist yet, continuing...')
  }

  // Create employer
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

  // Create employee user with employee card
  const employee = await prisma.user.create({
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

  // Create company settings for employer
  await prisma.companySettings.create({
    data: {
      employerId: employer.id,
      earlyThresholdHours: 24,
      starsCompletedEarly: 5,
      starsCompletedOnTime: 3,
      starsCompletedLate: 1
    }
  })

  console.log('âœ… Seed complete!')
  console.log('')
  console.log('Employer: employer@company.com / password123')
  console.log('Employee: john@company.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })