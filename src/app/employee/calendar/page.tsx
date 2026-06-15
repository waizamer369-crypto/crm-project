"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"
import { Calendar, CheckCircle, Clock, AlertCircle, LogOut, ChevronLeft, ChevronRight, User, FolderKanban, Layout } from "lucide-react"

interface Task {
  id: string
  title: string
  deadline: string
  status: string
  priority: string
  assignee?: { name: string; id: string; email: string }
  project: { name: string }
}

export default function EmployeeCalendar() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // ✅ Only fetch tasks once session is loaded
  useEffect(() => {
    if (status === "loading") return
    if (session?.user) {
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => {
          setTasks(data)
          setLoading(false)
        })
    }
  }, [session, status])

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

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const tasksForDate = (date: Date) => tasks.filter(t => isSameDay(new Date(t.deadline), date))
  const selectedDateTasks = selectedDate ? tasksForDate(selectedDate) : []

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "DONE").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    overdue: tasks.filter(t => t.status === "OVERDUE").length
  }

  // ✅ Loading guard
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // ✅ Role check after loading
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Access denied. <Link href="/login" className="text-blue-600">Login</Link></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CRM Pro</h1>
                <p className="text-xs text-slate-500">My Workspace</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link href="/employee/calendar" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
                <Calendar className="w-5 h-5" />
                My Calendar
              </Link>
              <Link href="/employee/kanban" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
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
            <div>
              <h2 className="text-2xl font-bold text-slate-900">My Calendar</h2>
              <p className="text-sm text-slate-500 mt-1">Your tasks and deadlines</p>
            </div>
          </header>

          <div className="p-8">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                </div>
                <p className="text-sm text-slate-500">Total Tasks</p>
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
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl transition"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Week Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {weekDays.map(day => (
                    <div key={day} className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayTasks = tasksForDate(day)
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                    const isTodayDate = isToday(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[120px] border-b border-r border-slate-100 p-2 cursor-pointer transition hover:bg-slate-50 ${
                          !isCurrentMonth ? "bg-slate-50/50 text-slate-400" : ""
                        } ${isSelected ? "bg-blue-50" : ""}`}
                      >
                        <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                          isTodayDate ? "bg-blue-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"
                        }`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map(task => (
                            <div
                              key={task.id}
                              className={`text-xs px-2 py-1 rounded-lg border truncate ${getTaskTextColor(task)}`}
                              title={task.title}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-slate-400 px-2">+{dayTasks.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected Date Tasks */}
            {selectedDate && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Tasks for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="space-y-3">
                  {selectedDateTasks.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No tasks on this day</p>
                    </div>
                  ) : (
                    selectedDateTasks.map(task => (
                      <div key={task.id} className={`bg-white rounded-2xl border p-5 ${getTaskTextColor(task)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`}></div>
                              <h4 className="font-bold text-lg text-slate-900">{task.title}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTaskTextColor(task)}`}>
                                {task.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-sm opacity-75 mb-1">{task.project?.name}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> To Do</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> In Progress</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Done</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Overdue</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}