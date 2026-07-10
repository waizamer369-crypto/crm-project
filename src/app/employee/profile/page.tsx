"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { User, Mail, Phone, Briefcase, Star, Calendar, LogOut, Layout, CheckCircle, Clock, AlertCircle, Award, TrendingUp, FolderKanban, MessageSquare, ChevronUp, ChevronDown, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"
import { Send } from "lucide-react"
import { usePathname } from "next/navigation"

interface EmployeeCard {
  id: string
  fullName: string
  jobTitle: string
  phoneNumber?: string
  email: string
  starRating: number
  status: string
  activeProjects: { project: { id: string; name: string } }[]
  starHistory: { 
    id: string
    changeAmount: number 
    reason: string 
    description: string
    createdAt: string 
    givenBy: { name: string } 
  }[]
}

interface Task {
  id: string
  title: string
  deadline: string
  status: string
  priority: string
  project: { name: string }
}

export default function EmployeeProfile() {
  const { data: session } = useSession()
  const [card, setCard] = useState<EmployeeCard | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/employees/me`)
        .then((res) => res.json())
        .then((data) => {
          setCard(data)
          setLoading(false)
        })

      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => setTasks(data))
    }
  }, [session])

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
    overdue: tasks.filter(t => new Date() > new Date(t.deadline) && t.status !== "DONE").length
  }

  const getReasonIcon = (reason: string) => {
    const icons: Record<string, any> = {
      TASK_COMPLETION: CheckCircle,
      QUALITY_WORK: Award,
      ATTENDANCE: Clock,
      TEAMWORK: User,
      INITIATIVE: TrendingUp,
      NEEDS_IMPROVEMENT: AlertCircle,
      OTHER: MessageSquare
    }
    return icons[reason] || Star
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      TASK_COMPLETION: "Task Completion",
      QUALITY_WORK: "Quality of Work",
      ATTENDANCE: "Attendance & Punctuality",
      TEAMWORK: "Teamwork",
      INITIATIVE: "Initiative",
      NEEDS_IMPROVEMENT: "Needs Improvement",
      OTHER: "Other"
    }
    return labels[reason] || reason
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
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

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
                <p className="text-sm text-slate-500 mt-1">Your employee card and performance</p>
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
            {loading || !card ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Employee Card */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Briefcase className="w-8 h-8 opacity-80" />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
                          {card.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{card.fullName}</h3>
                      <p className="text-blue-100">{card.jobTitle}</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-900">{card.email}</p>
                        </div>
                      </div>

                      {card.phoneNumber && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm font-medium text-slate-900">{card.phoneNumber}</p>
                          </div>
                        </div>
                      )}

                      {/* Star Rating */}
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Star Rating</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-6 h-6 ${
                                  star <= Math.round(card.starRating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-2xl font-bold text-slate-900">{card.starRating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Active Projects */}
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Active Projects</p>
                        <div className="flex flex-wrap gap-2">
                          {card.activeProjects && card.activeProjects.length > 0 ? (
                            card.activeProjects.map((ap, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                {ap.project?.name || "Unknown"}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400">No active projects</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xl font-bold text-slate-900">{stats.done}</span>
                      </div>
                      <p className="text-xs text-slate-500">Tasks Done</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-xl font-bold text-slate-900">{stats.inProgress}</span>
                      </div>
                      <p className="text-xs text-slate-500">In Progress</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Star History & Recent Tasks */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Star History */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Performance History</h3>
                        <p className="text-sm text-slate-500">Recent ratings and feedback from your employer</p>
                      </div>
                    </div>

                    {card.starHistory && card.starHistory.length > 0 ? (
                      <div className="space-y-3">
                        {card.starHistory.map((log, idx) => {
                          const ReasonIcon = getReasonIcon(log.reason)
                          return (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                log.changeAmount > 0 ? "bg-emerald-100 text-emerald-700" :
                                log.changeAmount < 0 ? "bg-red-100 text-red-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>
                                {log.changeAmount > 0 ? <ChevronUp className="w-5 h-5" /> : 
                                 log.changeAmount < 0 ? <ChevronDown className="w-5 h-5" /> : 
                                 <Star className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900">{getReasonLabel(log.reason)}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    log.changeAmount > 0 ? "bg-emerald-100 text-emerald-700" :
                                    log.changeAmount < 0 ? "bg-red-100 text-red-700" :
                                    "bg-slate-100 text-slate-600"
                                  }`}>
                                    {log.changeAmount > 0 ? "+" : ""}{log.changeAmount}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>By {log.givenBy?.name || "Employer"}</span>
                                  <span>•</span>
                                  <span>{format(new Date(log.createdAt), "MMM d, yyyy")}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No ratings yet</p>
                        <p className="text-sm text-slate-400 mt-1">Your employer will rate your performance here</p>
                      </div>
                    )}
                  </div>

                  {/* Recent Tasks */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Recent Tasks</h3>
                        <p className="text-sm text-slate-500">Your latest assignments</p>
                      </div>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No tasks assigned yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasks.slice(0, 5).map(task => (
                          <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                            task.status === "DONE" ? "bg-emerald-50 border-emerald-200" :
                            task.status === "IN_PROGRESS" ? "bg-blue-50 border-blue-200" :
                            new Date() > new Date(task.deadline) && task.status !== "DONE" ? "bg-red-50 border-red-200" :
                            "bg-slate-50 border-slate-200"
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  task.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
                                  task.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                                  task.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500">{task.project?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-700">{format(new Date(task.deadline), "MMM d")}</p>
                              <p className={`text-xs ${
                                task.status === "DONE" ? "text-emerald-600" :
                                task.status === "IN_PROGRESS" ? "text-blue-600" :
                                "text-slate-500"
                              }`}>{task.status.replace("_", " ")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Request Modal */}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}
    </div>
  )
}