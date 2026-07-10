"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Layout, CheckCircle, Clock, AlertCircle, LogOut, Calendar, User, FolderKanban, MessageSquare, ChevronLeft, ChevronRight, Send, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"

import { usePathname } from "next/navigation"

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
  { id: "TODO", title: "To Do", color: "bg-slate-100", dotColor: "bg-slate-400", borderColor: "border-slate-200" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50", dotColor: "bg-blue-500", borderColor: "border-blue-200" },
  { id: "DONE", title: "Done", color: "bg-emerald-50", dotColor: "bg-emerald-500", borderColor: "border-emerald-200" },
  { id: "OVERDUE", title: "Overdue", color: "bg-red-50", dotColor: "bg-red-500", borderColor: "border-red-200" }
]

export default function EmployeeKanban() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

const pathname = usePathname()

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

  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access denied</p>
          <Link href="/login" className="text-blue-600 hover:underline">Login as Employee</Link>
        </div>
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    LOW: "border-l-slate-400",
    MEDIUM: "border-l-amber-400",
    HIGH: "border-l-orange-400",
    CRITICAL: "border-l-red-500"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CRM Pro</h1>
                <p className="text-xs text-slate-500">My Workspace</p>
              </div>
            </div>

<nav className="space-y-1">
  <Link href="/employee/calendar" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/calendar" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Calendar className="w-5 h-5" />
    My Calendar
  </Link>
  <Link href="/employee/kanban" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/kanban" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Layout className="w-5 h-5" />
    Kanban Board
  </Link>
  <Link href="/employee/projects" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/projects" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <FolderKanban className="w-5 h-5" />
    My Projects
  </Link>
  <Link href="/employee/notes" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/notes" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <StickyNote className="w-5 h-5" />
    Notes
  </Link>
  <Link href="/employee/meetings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/meetings" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <PhoneCall className="w-5 h-5" />
    Meetings
  </Link>
  <Link href="/employee/profile" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/profile" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <User className="w-5 h-5" />
    My Profile
  </Link>
  <Link href="/employee/chat" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employee/chat" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <MessageSquare className="w-5 h-5" />
    Chat
  </Link>
</nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {session.user.name?.[0] || "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
                <p className="text-xs text-slate-500">Employee</p>
              </div>
              <Link href="/login" className="text-slate-400 hover:text-red-500 transition">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Kanban Board</h2>
                <p className="text-sm text-slate-500 mt-1">Move tasks across stages</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                  <Send className="w-4 h-4" /> Send Request
                </button>
                <NotificationBell />
              </div>
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {columns.map(column => {
                  const columnTasks = tasks
                    .filter(t => t.status === column.id)
                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

                  return (
                    <div key={column.id} className={`${column.color} rounded-2xl border ${column.borderColor} p-4`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${column.dotColor}`}></div>
                          <h3 className="font-bold text-slate-800">{column.title}</h3>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-slate-600 shadow-sm">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {columnTasks.map(task => (
                          <div
                            key={task.id}
                            className={`bg-white rounded-xl border border-slate-200 p-4 border-l-4 ${priorityColors[task.priority]} shadow-sm hover:shadow-md transition`}
                          >
                            <h4 className="font-semibold text-slate-900 mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{format(new Date(task.deadline), "MMM d")}</span>
                              <span>{task.project?.name}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              {column.id === "TODO" && (
                                <button
                                  onClick={() => moveTask(task.id, "IN_PROGRESS")}
                                  className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
                                >
                                  Forward
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                              {column.id === "IN_PROGRESS" && (
                                <>
                                  <button
                                    onClick={() => moveTask(task.id, "TODO")}
                                    className="flex-1 text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition font-medium flex items-center justify-center gap-1"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                    Back
                                  </button>
                                  <button
                                    onClick={() => moveTask(task.id, "DONE")}
                                    className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
                                  >
                                    Forward
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              {column.id === "DONE" && (
                                <button
                                  onClick={() => moveTask(task.id, "IN_PROGRESS")}
                                  className="flex-1 text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition font-medium flex items-center justify-center gap-1"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  Back
                                </button>
                              )}
                              {column.id === "OVERDUE" && (
                                <>
                                  <button
                                    onClick={() => moveTask(task.id, "IN_PROGRESS")}
                                    className="flex-1 text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition font-medium flex items-center justify-center gap-1"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                    In Progress
                                  </button>
                                  <button
                                    onClick={() => moveTask(task.id, "DONE")}
                                    className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
                                  >
                                    Mark Done
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </>
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

      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}
    </div>
  )
}