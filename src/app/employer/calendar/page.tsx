"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"
import { Calendar, CheckCircle, Clock, AlertCircle, LogOut, ChevronLeft, ChevronRight, Briefcase, Users, User, ChevronDown, X, LayoutList, MessageSquare, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"
import { Send } from "lucide-react"

import { usePathname } from "next/navigation"

interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  status: string
  priority: string
  assignee?: { name: string; id: string; email: string }
  project: { name: string }
}

interface Employee {
  id: string
  fullName: string
  email: string
  jobTitle: string
}

export default function EmployerCalendar() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false)
  const [dayViewOpen, setDayViewOpen] = useState(false)
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
  }, [])

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const fetchEmployees = () => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
  }

  const filteredTasks = selectedEmployee === "all"
    ? tasks
    : tasks.filter(t => t.assignee?.id === selectedEmployee || t.assignee?.email === selectedEmployee)

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

  const getPriorityColor = (priority: string) => {
    if (priority === "CRITICAL") return "bg-red-100 text-red-700"
    if (priority === "HIGH") return "bg-orange-100 text-orange-700"
    if (priority === "MEDIUM") return "bg-amber-100 text-amber-700"
    return "bg-slate-100 text-slate-600"
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const tasksForDate = (date: Date) => filteredTasks.filter(t => isSameDay(new Date(t.deadline), date))

  const getTasksByEmployeeForDate = (date: Date) => {
    const dayTasks = tasks.filter(t => isSameDay(new Date(t.deadline), date))
    const groups = employees.map(emp => ({
      employee: emp,
      tasks: dayTasks.filter(t => t.assignee?.id === emp.id || t.assignee?.email === emp.email)
    })).filter(g => g.tasks.length > 0)
    const unassigned = dayTasks.filter(t => !t.assignee)
    return { groups, unassigned }
  }

  const openDayView = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    setDayViewDate(date)
    setDayViewOpen(true)
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const stats = {
    total: filteredTasks.length,
    done: filteredTasks.filter(t => t.status === "DONE").length,
    inProgress: filteredTasks.filter(t => t.status === "IN_PROGRESS").length,
    overdue: filteredTasks.filter(t => t.status === "OVERDUE").length
  }

  const selectedEmployeeName = selectedEmployee === "all"
    ? "All Employees"
    : employees.find(e => e.id === selectedEmployee)?.fullName || "Unknown"

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Access denied. <Link href="/login" className="text-blue-600">Login</Link></p>
      </div>
    )
  }

  const dayViewData = dayViewDate ? getTasksByEmployeeForDate(dayViewDate) : { groups: [], unassigned: [] }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CRM Pro</h1>
                <p className="text-xs text-slate-500">Project Manager</p>
              </div>
            </div>
<nav className="space-y-1">
  <Link href="/employer/projects" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/projects" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <CheckCircle className="w-5 h-5" />
    Projects & Tasks
  </Link>
  <Link href="/employer/employees" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/employees" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Users className="w-5 h-5" />
    Employees
  </Link>
  <Link href="/employer/calendar" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/calendar" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Calendar className="w-5 h-5" />
    Calendar
  </Link>
  <Link href="/employer/notes" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/notes" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <StickyNote className="w-5 h-5" />
    Notes
  </Link>
  <Link href="/employer/meetings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/meetings" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <PhoneCall className="w-5 h-5" />
    Meetings
  </Link>
  <Link href="/employer/chat" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/chat" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <MessageSquare className="w-5 h-5" />
    Chat
  </Link>
  <Link href="/employer/requests" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === "/employer/requests" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
    <Send className="w-5 h-5" />
    Requests
  </Link>
</nav>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-4">Filter by Employee</p>
              <div className="relative px-2">
                <button
                  onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition text-sm font-medium ${employeeDropdownOpen || selectedEmployee !== "all" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedEmployee === "all" ? "bg-blue-100" : "bg-gradient-to-br from-purple-500 to-purple-600"}`}>
                    <User className={`w-4 h-4 ${selectedEmployee === "all" ? "text-blue-600" : "text-white"}`} />
                  </div>
                  <div className="flex-1 text-left"><p className="truncate">{selectedEmployeeName}</p></div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${employeeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {employeeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setEmployeeDropdownOpen(false)} />
                    <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 max-h-64 overflow-y-auto">
                      <button onClick={() => { setSelectedEmployee("all"); setEmployeeDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition flex items-center gap-3 ${selectedEmployee === "all" ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}>
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span>All Employees</span>
                        {selectedEmployee === "all" && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                      </button>
                      <div className="mx-3 my-1 border-t border-slate-100" />
                      {employees.map((emp) => {
                        const empTaskCount = tasks.filter(t => t.assignee?.id === emp.id || t.assignee?.email === emp.email).length
                        return (
                          <button key={emp.id} onClick={() => { setSelectedEmployee(emp.id); setEmployeeDropdownOpen(false) }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition flex items-center gap-3 ${selectedEmployee === emp.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}>
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {emp.fullName?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{emp.fullName}</p>
                              <p className="text-xs text-slate-500">{empTaskCount} tasks</p>
                            </div>
                            {selectedEmployee === emp.id && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                {session.user.name?.[0] || "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
                <p className="text-xs text-slate-500">Employer</p>
              </div>
              <Link href="/login" className="text-slate-400 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Team Calendar</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedEmployee === "all" ? "View all employee tasks and deadlines" : `Viewing tasks for ${selectedEmployeeName}`}
                </p>
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
              {[
                { label: "Total Tasks", value: stats.total, icon: <CheckCircle className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
                { label: "Completed", value: stats.done, icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
                { label: "In Progress", value: stats.inProgress, icon: <Clock className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
                { label: "Overdue", value: stats.overdue, icon: <AlertCircle className="w-5 h-5 text-red-600" />, bg: "bg-red-50" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
                    <span className="text-2xl font-bold text-slate-900">{s.value}</span>
                  </div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">
                    {format(currentMonth, "MMMM yyyy")}
                    {selectedEmployee !== "all" && <span className="text-sm font-normal text-slate-500 ml-2">— {selectedEmployeeName}</span>}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition">Today</button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-200">
                  {weekDays.map(day => (
                    <div key={day} className="px-4 py-3 text-center text-sm font-semibold text-slate-500">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayTasks = tasksForDate(day)
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                    const isTodayDate = isToday(day)
                    const allDayTasks = tasks.filter(t => isSameDay(new Date(t.deadline), day))

                    return (
                      <div key={idx} className={`min-h-[120px] border-b border-r border-slate-100 p-2 transition ${!isCurrentMonth ? "bg-slate-50/50" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? "bg-blue-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"}`}>
                            {format(day, "d")}
                          </div>
                          {allDayTasks.length > 0 && (
                            <button
                              onClick={(e) => openDayView(day, e)}
                              title="View all employee tasks for this day"
                              className="p-1 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition"
                            >
                              <LayoutList className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map(task => (
                            <div key={task.id}
                              className={`text-xs px-2 py-1 rounded-lg border truncate ${getTaskTextColor(task)}`}
                              title={`${task.title} — ${task.assignee?.name || "Unassigned"}`}>
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

            <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div>To Do</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>In Progress</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Done</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>Overdue</span>
              <span className="flex items-center gap-2"><LayoutList className="w-3.5 h-3.5 text-blue-500" />Click icon to see employee day tasks</span>
            </div>
          </div>
        </main>
      </div>

      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}

      {dayViewOpen && dayViewDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <LayoutList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{format(dayViewDate, "EEEE, MMMM d, yyyy")}</h3>
                  <p className="text-sm text-slate-500">
                    {dayViewData.groups.reduce((acc, g) => acc + g.tasks.length, 0) + dayViewData.unassigned.length} total tasks
                  </p>
                </div>
              </div>
              <button onClick={() => setDayViewOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {dayViewData.groups.length === 0 && dayViewData.unassigned.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No tasks on this day</p>
                </div>
              ) : (
                <>
                  {dayViewData.groups.map(({ employee, tasks: empTasks }) => (
                    <div key={employee.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {employee.fullName?.[0] || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{employee.fullName}</p>
                          <p className="text-xs text-slate-500">{employee.jobTitle}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {empTasks.filter(t => t.status === "DONE").length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              {empTasks.filter(t => t.status === "DONE").length} done
                            </span>
                          )}
                          {empTasks.filter(t => t.status === "IN_PROGRESS").length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {empTasks.filter(t => t.status === "IN_PROGRESS").length} in progress
                            </span>
                          )}
                          {empTasks.filter(t => t.status === "OVERDUE").length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                              {empTasks.filter(t => t.status === "OVERDUE").length} overdue
                            </span>
                          )}
                          {empTasks.filter(t => t.status === "TODO").length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                              {empTasks.filter(t => t.status === "TODO").length} to do
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {empTasks.map(task => (
                          <div key={task.id} className="px-5 py-3 flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getTaskColor(task)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-900 text-sm">{task.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getTaskTextColor(task)}`}>
                                  {task.status.replace("_", " ")}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                              <p className="text-xs text-slate-400 mt-0.5">{task.project?.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {dayViewData.unassigned.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Unassigned</p>
                          <p className="text-xs text-slate-500">{dayViewData.unassigned.length} task{dayViewData.unassigned.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {dayViewData.unassigned.map(task => (
                          <div key={task.id} className="px-5 py-3 flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getTaskColor(task)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-900 text-sm">{task.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getTaskTextColor(task)}`}>
                                  {task.status.replace("_", " ")}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{task.project?.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}