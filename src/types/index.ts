export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: string
  deadline: Date
  originalDeadline?: Date
  status: string
  projectId: string
  assigneeId?: string
  assignee?: User
  creatorId: string
  completedAt?: Date
  project: { name: string }
}
