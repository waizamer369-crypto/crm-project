import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Delete existing data first (clean slate)
  await prisma.starLog.deleteMany()
  await prisma.kanbanLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.projectShare.deleteMany()
  await prisma.project.deleteMany()
  await prisma.employeeCard.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.user.deleteMany()

  // Create employer
  const employer = await prisma.user.create({
    data: {
      email: 'employer@company.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'EMPLOYER'
    }
  })

  // Create employee user
  const employee = await prisma.user.create({
    data: {
      email: 'john@company.com',
      password: hashedPassword,
      name: 'John',
      role: 'EMPLOYEE'
    }
  })

  // Create employee card for John (THIS IS THE KEY!)
  await prisma.employeeCard.create({
    data: {
      userId: employee.id,
      fullName: 'John Doe',
      jobTitle: 'Developer',
      email: 'john@company.com',
      status: 'ACTIVE',
      starRating: 3.0
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

  console.log('✅ Seed complete!')
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