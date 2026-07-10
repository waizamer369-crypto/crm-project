"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { FolderKanban, Calendar, User, LogOut, CheckCircle, Clock, AlertCircle, Layout, Briefcase, MessageSquare, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"
import { Send } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  deadline: string
  status: string
}

interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  status: string
  priority: string
  project: { id: string; name: string }
}

export default function EmployeeProjects() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => {
          const myTasks = data.filter((t: Task) => t.status !== "DONE")
          setTasks(myTasks)

          const projectMap = new Map()
          data.forEach((task: Task) => {
            const projectId = task.project?.id
            if (projectId && !projectMap.has(projectId)) {
              projectMap.set(projectId, {
                id: projectId,
                name: task.project?.name,
                description: "",
                deadline: task.deadline,
                status: "ACTIVE"
              })
            }
          })
          setProjects(Array.from(projectMap.values()))
          setLoading(false)
        })
    }
  }, [session])

  const getTaskColor = (task: Task) => {
    if (task.status === "DONE") return "bg-emerald-500"
    if (task.status === "IN_PROGRESS") return "bg-blue-500"
    if (task.status === "OVERDUE") return "bg-red-500"
    return "bg-slate-400"
  }

  const getTaskTextColor = (task: Task) => {
    if (task.status === "DONE") return "text-emerald-700 bg-emerald-50 border-emerald-200"
    if (task.status === "IN_PROGRESS") return "text-blue-700 bg-blue-50 border-blue-200"
    if (task.status === "OVERDUE") return "text-red-700 bg-red-50 border-red-200"
    return "text-slate-700 bg-slate-50 border-slate-200"
  }

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700"
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

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "DONE").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    overdue: tasks.filter(t => t.status === "OVERDUE").length
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <FolderKanban className="w-5 h-5 text-white" />
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
                <h2 className="text-2xl font-bold text-slate-900">My Projects</h2>
                <p className="text-sm text-slate-500 mt-1">Your assigned projects and tasks</p>
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
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                </div>
                <p className="text-sm text-slate-500">Active Tasks</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.done}</span>
                </div>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.inProgress}</span>
                </div>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.overdue}</span>
                </div>
                <p className="text-sm text-slate-500">Overdue</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">My Projects</h3>
                  {projects.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No projects assigned yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {project.name[0]}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{project.name}</h4>
                              <span className="text-xs text-slate-500">{project.status}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mb-3">{project.description || "No description"}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">My Tasks</h3>
                  {tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No active tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${getTaskTextColor(task)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`}></div>
                                <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTaskTextColor(task)}`}>
                                  {task.status.replace("_", " ")}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(task.deadline), "MMM d, yyyy")}</span>
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{task.project?.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}


    </div>
  )
}