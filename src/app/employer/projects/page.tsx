"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Plus, Users, CheckCircle, Clock, LogOut, Briefcase, X, Mail, Search, Trash2, ChevronDown, ChevronUp, Filter, UserPlus, Shield, User, Star, Share2, Calendar, Pencil, MessageSquare, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"
import { Send } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  deadline: string
  status: string
  _count: { tasks: number; members: number }
  members: { user: { id: string; email: string; name: string; role: string }; role?: string }[]
}

interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  status: string
  priority: string
  assignee?: { name: string; email: string }
  projectId: string
}

interface Employee {
  id: string
  fullName: string
  email: string
  jobTitle: string
}

const PROJECT_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "COMPLETED", label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
]

function ProjectStatusDropdown({ projectId, currentStatus, onStatusChange }: {
  projectId: string
  currentStatus: string
  onStatusChange: (projectId: string, newStatus: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const current = PROJECT_STATUSES.find(s => s.value === currentStatus) || PROJECT_STATUSES[0]

  const handleSelect = async (statusValue: string) => {
    if (statusValue === currentStatus) { setOpen(false); return }
    setUpdating(true); setOpen(false)
    const res = await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, status: statusValue })
    })
    setUpdating(false)
    if (res.ok) onStatusChange(projectId, statusValue)
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} disabled={updating}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition hover:opacity-80 ${current.color} ${updating ? "opacity-50" : ""}`}>
        {updating ? "Saving..." : current.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 w-36">
            {PROJECT_STATUSES.map((s) => (
              <button key={s.value} onClick={() => handleSelect(s.value)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-2 ${s.value === currentStatus ? "opacity-50 cursor-default" : ""}`}>
                <span className={`w-2 h-2 rounded-full ${s.value === "ACTIVE" ? "bg-emerald-500" : s.value === "ON_HOLD" ? "bg-amber-500" : s.value === "COMPLETED" ? "bg-blue-500" : "bg-red-500"}`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TaskStatusDropdown({ taskId, currentStatus, onStatusChange }: {
  taskId: string
  currentStatus: string
  onStatusChange: (taskId: string, newStatus: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const TASK_STATUSES = [
    { value: "TODO", label: "To Do", color: "bg-slate-100 text-slate-600 border-slate-200" },
    { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "DONE", label: "Done", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "OVERDUE", label: "Overdue", color: "bg-red-50 text-red-700 border-red-200" },
  ]
  const current = TASK_STATUSES.find(s => s.value === currentStatus) || TASK_STATUSES[0]

  const handleSelect = async (statusValue: string) => {
    if (statusValue === currentStatus) { setOpen(false); return }
    setUpdating(true); setOpen(false)
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: statusValue })
    })
    setUpdating(false)
    if (res.ok) onStatusChange(taskId, statusValue)
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} disabled={updating}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition hover:opacity-80 min-w-[80px] justify-between ${current.color} ${updating ? "opacity-50" : ""}`}>
        {updating ? "Saving..." : current.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 w-40">
            {TASK_STATUSES.map((s) => (
              <button key={s.value} onClick={() => handleSelect(s.value)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-2 whitespace-nowrap ${s.value === currentStatus ? "opacity-50 cursor-default" : ""}`}>
                <span className={`w-2 h-2 rounded-full ${s.value === "TODO" ? "bg-slate-400" : s.value === "IN_PROGRESS" ? "bg-blue-500" : s.value === "DONE" ? "bg-emerald-500" : "bg-red-500"}`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ShareWithClientButton({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    if (!email) return
    setLoading(true); setError("")
    const res = await fetch("/api/client-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, clientEmail: email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Something went wrong"); return }
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); setEmail("") }, 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-semibold">
        <Share2 className="w-4 h-4" />
        Share with Client
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Share Project</h3>
            <p className="text-sm text-slate-500 mb-4">Client will get a link via email to view progress.</p>
            {sent ? (
              <p className="text-green-600 font-semibold text-center py-4">✓ Email sent!</p>
            ) : (
              <>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3" />
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setOpen(false); setError(""); setEmail("") }}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSend} disabled={loading || !email}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? "Sending..." : "Send Link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}


export default function EmployerProjects() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false) // <-- ADDED
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [projectForm, setProjectForm] = useState({ name: "", description: "", deadline: "" })
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", deadline: "", priority: "MEDIUM", assigneeEmail: "", projectId: ""
  })
  const [editTaskForm, setEditTaskForm] = useState({
    title: "", description: "", deadline: "", priority: "MEDIUM", assigneeEmail: ""
  })
  const [memberForm, setMemberForm] = useState({
    fullName: "", jobTitle: "", email: "", phoneNumber: "", password: "",
    role: "EMPLOYEE" as "EMPLOYER" | "EMPLOYEE",
    projectRole: "MEMBER" as "MEMBER" | "ADMIN" | "VIEWER",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "FIRED",
    projectId: "", workingHoursPerDay: 8
  })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [editError, setEditError] = useState("")
  const [memberError, setMemberError] = useState("")
  const [memberSuccess, setMemberSuccess] = useState("")
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (session?.user) {
      fetchProjects()
      fetchTasks()
      fetchEmployees()
    }
  }, [session, status])

  useEffect(() => {
    const safeTasks = Array.isArray(tasks) ? tasks : []
    if (selectedProject === "all") {
      setFilteredTasks(safeTasks)
    } else {
      setFilteredTasks(safeTasks.filter(t => t.projectId === selectedProject))
    }
  }, [selectedProject, tasks])

  const fetchProjects = () => {
    fetch("/api/projects").then(r => r.json()).then(data => {
      setProjects(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => { setProjects([]); setLoading(false) })
  }

  const fetchTasks = () => {
    fetch("/api/tasks").then(r => r.json()).then(data => {
      const taskList = Array.isArray(data) ? data : []
      setTasks(taskList)
      setFilteredTasks(taskList)
    }).catch(() => { setTasks([]); setFilteredTasks([]) })
  }

  const fetchEmployees = () => {
    fetch("/api/employees").then(r => r.json()).then(data => {
      setEmployees(Array.isArray(data) ? data : [])
    }).catch(() => setEmployees([]))
  }

  const handleProjectStatusChange = (projectId: string, newStatus: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectForm)
    })
    if (res.ok) { setShowProjectModal(false); setProjectForm({ name: "", description: "", deadline: "" }); fetchProjects() }
    setCreating(false)
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault(); setEmailError(""); setCreating(true)
    try {
      const targetProjectId = taskForm.projectId || projects[0]?.id
      if (!targetProjectId) { setEmailError("Please select a project."); setCreating(false); return }
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...taskForm, 
          projectId: targetProjectId,
          deadline: taskForm.deadline ? taskForm.deadline + "T12:00:00.000Z" : taskForm.deadline
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error || "Failed to create task"); setCreating(false); return }
      setShowTaskModal(false)
      setTaskForm({ title: "", description: "", deadline: "", priority: "MEDIUM", assigneeEmail: "", projectId: "" })
      fetchTasks(); fetchProjects(); setCreating(false)
    } catch { setEmailError("Something went wrong."); setCreating(false) }
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : "",
      priority: task.priority,
      assigneeEmail: task.assignee?.email || ""
    })
    setEditError("")
    setShowEditTaskModal(true)
  }

  const saveEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    setSaving(true); setEditError("")
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId: editingTask.id, 
          ...editTaskForm,
          deadline: editTaskForm.deadline ? editTaskForm.deadline + "T12:00:00.000Z" : editTaskForm.deadline
        })
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || "Failed to update task"); setSaving(false); return }
      setShowEditTaskModal(false)
      setEditingTask(null)
      fetchTasks(); fetchProjects()
      setSaving(false)
    } catch { setEditError("Something went wrong."); setSaving(false) }
  }

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault(); setMemberError(""); setMemberSuccess(""); setCreating(true)
    try {
      const empRes = await fetch("/api/employees", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: memberForm.email, password: memberForm.password, name: memberForm.fullName,
          fullName: memberForm.fullName, jobTitle: memberForm.jobTitle, phoneNumber: memberForm.phoneNumber,
          role: memberForm.role, status: memberForm.status, workingHoursPerDay: memberForm.workingHoursPerDay
        })
      })
      const empData = await empRes.json()
      if (!empRes.ok) { setMemberError(empData.error || "Failed to create employee"); setCreating(false); return }

      if (memberForm.projectId) {
        const projRes = await fetch("/api/projects", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: memberForm.projectId, email: memberForm.email, role: memberForm.projectRole })
        })
        const projData = await projRes.json()
        if (!projRes.ok) { setMemberError(projData.error || "Employee created but failed to add to project"); setCreating(false); fetchProjects(); return }
      }

      setMemberSuccess(`${memberForm.fullName} was successfully added!`)
      setMemberForm({ fullName: "", jobTitle: "", email: "", phoneNumber: "", password: "", role: "EMPLOYEE", projectRole: "MEMBER", status: "ACTIVE", projectId: "", workingHoursPerDay: 8 })
      setCreating(false); fetchProjects(); fetchEmployees()
      setTimeout(() => { setShowAddMemberModal(false); setMemberSuccess("") }, 2000)
    } catch { setMemberError("Something went wrong."); setCreating(false) }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return
    await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" })
    fetchTasks(); fetchProjects()
  }

  const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation()
    if (!confirm(`Delete "${projectName}"? This will also delete all its tasks and chat messages. This can't be undone.`)) return
    const res = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
      fetchTasks()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || "Failed to delete project")
    }
  }

  const toggleProject = (projectId: string) => {
    if (expandedProject === projectId) { setExpandedProject(null); setSelectedProject("all") }
    else { setExpandedProject(projectId); setSelectedProject(projectId) }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>
  }

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access denied</p>
          <Link href="/login" className="text-blue-600 hover:underline">Login as Employer</Link>
        </div>
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600", MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700", CRITICAL: "bg-red-100 text-red-700"
  }
  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700", MEMBER: "bg-blue-100 text-blue-700", VIEWER: "bg-slate-100 text-slate-600"
  }
  const safeTasks = Array.isArray(tasks) ? tasks : []

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
          <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Projects & Tasks</h2>
              <p className="text-sm text-slate-500 mt-1">Click a project to see its tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium shadow-sm shadow-purple-200">
                <UserPlus className="w-5 h-5" />Add Member
              </button>
              <button onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium shadow-sm shadow-emerald-200">
                <Plus className="w-5 h-5" />Assign Task
              </button>
              <button onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-200">
                <Plus className="w-5 h-5" />New Project
              </button>
              <button onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                <Send className="w-4 h-4" /> Send Request
              </button>
              <NotificationBell />
            </div>
          </header>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Projects</h3>
                {selectedProject !== "all" && (
                  <button onClick={() => { setSelectedProject("all"); setExpandedProject(null) }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Filter className="w-4 h-4" />Show All Tasks
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No projects yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const isExpanded = expandedProject === project.id
                    const projectTasks = safeTasks.filter(t => t.projectId === project.id)
                    return (
                      <div key={project.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div onClick={() => toggleProject(project.id)}
                          className={`p-5 cursor-pointer hover:bg-slate-50 transition-all ${isExpanded ? 'bg-blue-50/50 border-b border-slate-100' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {project.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="font-bold text-slate-900 text-lg">{project.name}</h3>
                                  <ProjectStatusDropdown projectId={project.id} currentStatus={project.status} onStatusChange={handleProjectStatusChange} />
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(project.deadline), "MMM d, yyyy")}</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-blue-500" />{project._count.tasks} tasks</span>
                                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-purple-500" />{project._count.members} members</span>
                              </div>
                              <button
                                onClick={(e) => deleteProject(e, project.id, project.name)}
                                className="text-slate-400 hover:text-red-500 transition p-1"
                                title="Delete project"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="text-slate-400 hover:text-blue-600 transition">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                      {isExpanded && (
  <div className="p-5 bg-slate-50/50">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-slate-700">Team:</span>
        {project.members && project.members.length > 0 ? project.members.map((m, idx) => (
          <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-sm">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{m.user?.name || m.user?.email}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColors[m.role || "MEMBER"] || roleColors.MEMBER}`}>{m.role || "MEMBER"}</span>
          </span>
        )) : <span className="text-sm text-slate-400">No members yet</span>}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <ShareWithClientButton projectId={project.id} />
      </div>
    </div>

    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold text-slate-700">Tasks for {project.name}</h4>
      <button onClick={(e) => { e.stopPropagation(); setTaskForm({...taskForm, projectId: project.id}); setShowTaskModal(true) }}
        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        + Add Task
      </button>
    </div>

    {projectTasks.length === 0 ? (
      <p className="text-sm text-slate-400 py-4 text-center">No tasks in this project yet</p>
    ) : (
      <div className="space-y-2">
        {projectTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-semibold text-slate-900">{task.title}</h5>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                    {task.priority}
                  </span>
                  <TaskStatusDropdown taskId={task.id} currentStatus={task.status}
                    onStatusChange={(taskId, newStatus) => {
                      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
                      setFilteredTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
                    }} />
                </div>
                <p className="text-sm text-slate-500 mb-2">{(task.description || "")}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(task.deadline), "MMM d, yyyy")}</span>
                  {task.assignee && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{task.assignee.name} ({task.assignee.email})</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={(e) => { e.stopPropagation(); openEditTask(task) }}
                  className="text-slate-400 hover:text-blue-500 transition p-1" title="Edit task">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                  className="text-slate-400 hover:text-red-500 transition p-1" title="Delete task">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

  </div>
)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Request Modal — ADDED HERE */}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Create New Project</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={createProject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name</label>
                <input type="text" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Website Redesign" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={3} placeholder="Brief description..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProjectModal(false)} className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50">{creating ? "Creating..." : "Create Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Assign New Task</h3>
              <button onClick={() => { setShowTaskModal(false); setEmailError("") }} className="text-slate-400 hover:text-slate-600 transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={createTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Design Homepage" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} placeholder="What needs to be done?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                  <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project</label>
                <select value={taskForm.projectId} onChange={(e) => setTaskForm({...taskForm, projectId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Assign to Employee</label>
                <select value={taskForm.assigneeEmail} onChange={(e) => { setTaskForm({...taskForm, assigneeEmail: e.target.value}); setEmailError("") }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.email}>{emp.fullName} — {emp.email}</option>
                  ))}
                </select>
                {emailError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5"><Search className="w-4 h-4" />{emailError}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTaskModal(false); setEmailError("") }} className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium disabled:opacity-50">{creating ? "Assigning..." : "Assign Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Task</h3>
                  <p className="text-sm text-slate-500">Update task details</p>
                </div>
              </div>
              <button onClick={() => { setShowEditTaskModal(false); setEditingTask(null) }} className="text-slate-400 hover:text-slate-600 transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={saveEditTask} className="p-6 space-y-5">
              {editError && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{editError}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
                <input type="text" value={editTaskForm.title} onChange={(e) => setEditTaskForm({...editTaskForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={editTaskForm.description} onChange={(e) => setEditTaskForm({...editTaskForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                  <input type="date" value={editTaskForm.deadline} onChange={(e) => setEditTaskForm({...editTaskForm, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select value={editTaskForm.priority} onChange={(e) => setEditTaskForm({...editTaskForm, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reassign to Employee</label>
                <select value={editTaskForm.assigneeEmail} onChange={(e) => setEditTaskForm({...editTaskForm, assigneeEmail: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Keep current assignee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.email}>{emp.fullName} — {emp.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditTaskModal(false); setEditingTask(null) }} className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? "Saving..." : <><Pencil className="w-4 h-4" />Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add Team Member</h3>
                  <p className="text-sm text-slate-500">Create new employee and add to project</p>
                </div>
              </div>
              <button onClick={() => { setShowAddMemberModal(false); setMemberError(""); setMemberSuccess("") }} className="text-slate-400 hover:text-slate-600 transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={addMember} className="p-6 space-y-5">
              {memberError && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{memberError}</div>}
              {memberSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{memberSuccess}</div>}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Legal Name</label>
                <input type="text" value={memberForm.fullName} onChange={(e) => setMemberForm({...memberForm, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. John Michael Doe" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role / Position in Company</label>
                <input type="text" value={memberForm.jobTitle} onChange={(e) => setMemberForm({...memberForm, jobTitle: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Senior Software Engineer" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input type="email" value={memberForm.email} onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="john@company.com" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                  <input type="tel" value={memberForm.phoneNumber} onChange={(e) => setMemberForm({...memberForm, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="+1 234 567 890" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Set Password</label>
                <input type="password" value={memberForm.password} onChange={(e) => setMemberForm({...memberForm, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Minimum 6 characters" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Working Hours Per Day</label>
                <input type="number" min={1} max={24} value={memberForm.workingHoursPerDay}
                  onChange={(e) => setMemberForm({...memberForm, workingHoursPerDay: parseInt(e.target.value) || 8})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" required />
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">Star Rating: Auto-calculated based on task performance</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">Starts at 3.0 stars. Earn more by completing tasks early or on time.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Assign to Project <span className="text-slate-400 font-normal">(optional)</span></label>
                <select value={memberForm.projectId} onChange={(e) => setMemberForm({...memberForm, projectId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">No project (create employee only)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {memberForm.projectId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Project Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["MEMBER", "ADMIN", "VIEWER"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setMemberForm({...memberForm, projectRole: r})}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium ${memberForm.projectRole === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                        {r === "ADMIN" ? <Shield className="w-4 h-4" /> : r === "VIEWER" ? <Search className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">System Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["EMPLOYEE", "EMPLOYER"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setMemberForm({...memberForm, role: r})}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium ${memberForm.role === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                        {r === "EMPLOYER" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select value={memberForm.status} onChange={(e) => setMemberForm({...memberForm, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="FIRED">Fired</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddMemberModal(false); setMemberError(""); setMemberSuccess("") }}
                  className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? "Adding..." : <><UserPlus className="w-4 h-4" />Add Member</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}