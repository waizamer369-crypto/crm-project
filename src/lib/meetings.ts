import { prisma } from "@/lib/prisma"

// Grace period before an empty meeting is actually marked ENDED.
// This absorbs brief timing gaps (e.g. a quick leave+rejoin during page load)
// so a meeting isn't killed the instant it looks empty for a split second.
const EMPTY_GRACE_MS = 6000

export async function endStaleEmptyMeetings(meetingId?: string) {
  const meetings = await prisma.meeting.findMany({
    where: { status: "LIVE", ...(meetingId ? { id: meetingId } : {}) },
    include: { participants: true }
  })

  const now = Date.now()
  const staleIds: string[] = []

  for (const m of meetings) {
    const active = m.participants.filter(p => !p.leftAt)
    if (active.length > 0) continue

    const timestamps = m.participants
      .flatMap(p => [p.joinedAt, p.leftAt])
      .filter((d): d is Date => d !== null)
      .map(d => new Date(d).getTime())

    const lastActivity = timestamps.length > 0 ? Math.max(...timestamps) : new Date(m.createdAt).getTime()

    if (now - lastActivity > EMPTY_GRACE_MS) {
      staleIds.push(m.id)
    }
  }

  if (staleIds.length > 0) {
    await prisma.meeting.updateMany({
      where: { id: { in: staleIds } },
      data: { status: "ENDED" }
    })
  }
}