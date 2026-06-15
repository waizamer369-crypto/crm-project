import { prisma } from "./prisma"

interface StarCalculationResult {
  starsEarned: number
  reason: string
  description: string
}

export async function calculateStars(
  taskId: string,
  completedAt: Date,
  settingsId: string
): Promise<StarCalculationResult> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  })

  if (!task) throw new Error("Task not found")

  const settings = await prisma.companySettings.findUnique({
    where: { id: settingsId }
  })

  if (!settings) throw new Error("Company settings not found")

  const deadline = new Date(task.deadline)
  const completed = new Date(completedAt)
  const diffMs = deadline.getTime() - completed.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (completed > new Date()) {
    throw new Error("Completion timestamp cannot be in the future")
  }

  if (diffHours > settings.earlyThresholdHours) {
    return {
      starsEarned: settings.starsCompletedEarly,
      reason: "COMPLETED_EARLY",
      description: `Completed ${Math.round(diffHours)} hours before deadline`
    }
  } else if (diffHours >= 0) {
    return {
      starsEarned: settings.starsCompletedOnTime,
      reason: "COMPLETED_ON_TIME",
      description: "Completed on or before deadline"
    }
  } else {
    return {
      starsEarned: settings.starsCompletedLate,
      reason: "COMPLETED_LATE",
      description: `Completed ${Math.round(Math.abs(diffHours))} hours after deadline`
    }
  }
}

export async function updateEmployeeStarRating(employeeCardId: string) {
  const logs = await prisma.starLog.findMany({
    where: { employeeCardId }
  })

  const totalStars = logs.reduce((sum, log) => sum + log.changeAmount, 0)
  const clampedStars = Math.max(0, totalStars)

  await prisma.employeeCard.update({
    where: { id: employeeCardId },
    data: { starRating: clampedStars }
  })

  return clampedStars
}
