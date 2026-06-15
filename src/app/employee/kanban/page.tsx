"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Layout, Calendar, User, LogOut, FolderKanban, Settings } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  status: string
  priority: string
  project: { name: string }
}

const columns = [
  { id: "TODO", title: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50" },
  { id: "DONE", title: "Done", color: "bg-green-50" },
  { id: "OVERDUE", title: "Overdue", color: "bg-red-50" }
]

export default function KanbanBoard() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const isEmployer = session?.user?.role === "EMPLOYER"
  const isEmployee = session?.user?.role === "EMPLOYEE"

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
  }, [])

  const moveTask = async (taskId: string, newStatus: string) => {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus })
    })

    if (res.ok) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!session?.user || (!isEmployer && !isEmployee)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/login" className="text-blue-600">Login</Link></p>
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    LOW: "border-l-gray-400",
    MEDIUM: "border-l-yellow-400",
    HIGH: "border-l-orange-400",
    CRITICAL: "border-l-red-500"
  }

  // Employer: full control (back/forward including OVERDUE)
  // Employee: can move TODO↔IN_PROGRESS↔DONE only (no OVERDUE)
  const canMoveBack = (columnId: string) => {
    if (isEmployer) return columnId !== "TODO"
    return columnId === "IN_PROGRESS" || columnId === "DONE"
  }

  const canMoveForward = (columnId: string) => {
    if (isEmployer) return columnId !== "OVERDUE"
    return columnId === "TODO" || columnId === "IN_PROGRESS"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CRM Pro</h1>
                <p className="text-xs text-slate-500">{isEmployer ? "Employer View" : "My Workspace"}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {isEmployee && (
                <>
                  <Link href="/employee/calendar" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                    <Calendar className="w-5 h-5" />
                    My Calendar
                  </Link>
                  <Link href="/employee/kanban" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
                    <Layout className="w-5 h-5" />
                    Kanban Board
                  </Link>
                  <Link href="/employee/projects" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                    <FolderKanban className="w-5 h-5" />
                    My Projects
                  </Link>
                  <Link href="/employee/profile" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                </>
              )}

              {isEmployer && (
                <>
                  <Link href="/employer/projects" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                    <FolderKanban className="w-5 h-5" />
                    Projects
                  </Link>
                  <Link href="/employer/kanban" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
                    <Layout className="w-5 h-5" />
                    Kanban Board
                  </Link>
                  <Link href="/employer/settings" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {session.user.name?.[0] || (isEmployer ? "E" : "U")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
                <p className="text-xs text-slate-500">{isEmployer ? "Employer" : "Employee"}</p>
              </div>
              <Link href="/login" className="text-slate-400 hover:text-red-500 transition">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Kanban Board</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isEmployer
                    ? "Manage and update task progress across all projects"
                    : "Update your task progress"}
                </p>
              </div>
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {columns.map(column => {
                  const columnTasks = tasks
                    .filter(t => t.status === column.id)
                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

                  return (
                    <div key={column.id} className={`${column.color} rounded-2xl p-4`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">{column.title}</h3>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {columnTasks.map(task => (
                          <div
                            key={task.id}
                            className={`p-4 bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition`}
                          >
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                              <span>{format(new Date(task.deadline), "MMM d")}</span>
                              <span>{task.project?.name}</span>
                            </div>

                            {/* Both employers and employees can move tasks */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {canMoveBack(column.id) && (
                                <button
                                  onClick={() => {
                                    const prevMap: Record<string, string> = { IN_PROGRESS: "TODO", DONE: "IN_PROGRESS", OVERDUE: "DONE" }
                                    moveTask(task.id, prevMap[column.id] || "TODO")
                                  }}
                                  className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                  ← Back
                                </button>
                              )}
                              {canMoveForward(column.id) && (
                                <button
                                  onClick={() => {
                                    const nextMap: Record<string, string> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "OVERDUE" }
                                    moveTask(task.id, nextMap[column.id] || "DONE")
                                  }}
                                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                                >
                                  Forward →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}