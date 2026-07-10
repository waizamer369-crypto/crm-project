"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, Phone, Mail, Briefcase, Plus, X, User, Shield, UserCheck, LogOut, Users, CheckCircle, MessageSquare, TrendingUp, Award, Calendar, Trash2, StickyNote, PhoneCall } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"
import { Send } from "lucide-react"

import { usePathname } from "next/navigation"


interface Employee {
  id: string
  fullName: string
  jobTitle: string
  phoneNumber?: string
  email: string
  starRating: number
  status: string
  activeProjects: { project: { name: string } }[]
}

export default function EmployerEmployees() {
  const { data: session, status } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")
  const [showRequestModal, setShowRequestModal] = useState(false)

  const pathname = usePathname()

  const [ratingForm, setRatingForm] = useState({
    starChange: 0,
    reason: "TASK_COMPLETION" as "TASK_COMPLETION" | "QUALITY_WORK" | "ATTENDANCE" | "TEAMWORK" | "INITIATIVE" | "NEEDS_IMPROVEMENT" | "OTHER",
    description: ""
  })

  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    name: "",
    fullName: "",
    jobTitle: "",
    phoneNumber: "",
    role: "EMPLOYEE" as "EMPLOYER" | "EMPLOYEE",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ON_LEAVE"
  })

  useEffect(() => {
    if (status === "loading") return
    if (session?.user) fetchEmployees()
  }, [session, status])

  const fetchEmployees = () => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data)
        setLoading(false)
      })
  }

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")
    setCreating(true)

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee)
    })

    const data = await res.json()

    if (!res.ok) {
      setFormError(data.error || "Failed to create employee")
      setCreating(false)
      return
    }

    setFormSuccess(`Successfully created ${newEmployee.fullName || newEmployee.name}`)
    setNewEmployee({ email: "", password: "", name: "", fullName: "", jobTitle: "", phoneNumber: "", role: "EMPLOYEE", status: "ACTIVE" })
    setCreating(false)
    fetchEmployees()

    setTimeout(() => {
      setShowAddModal(false)
      setFormSuccess("")
    }, 1500)
  }

  const openRateModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setRatingForm({ starChange: 0, reason: "TASK_COMPLETION", description: "" })
    setFormError("")
    setFormSuccess("")
    setShowRateModal(true)
  }

  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDeleteModal(true)
  }

  const deleteEmployee = async () => {
    if (!selectedEmployee) return
    setDeleting(true)

    const res = await fetch(`/api/employees?id=${selectedEmployee.id}`, {
      method: "DELETE"
    })

    const data = await res.json()
    setDeleting(false)

    if (!res.ok) {
      alert(data.error || "Failed to delete employee")
      return
    }

    setShowDeleteModal(false)
    setSelectedEmployee(null)
    fetchEmployees()
  }

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return
    if (ratingForm.starChange === 0) {
      setFormError("Please select a star rating change")
      return
    }

    setCreating(true)
    setFormError("")

    const res = await fetch("/api/employees/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployee.id,
        starChange: ratingForm.starChange,
        reason: ratingForm.reason,
        description: ratingForm.description
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setFormError(data.error || "Failed to submit rating")
      setCreating(false)
      return
    }

    setFormSuccess(`Rating updated! ${selectedEmployee.fullName} now has ${data.newRating.toFixed(1)} stars`)
    setCreating(false)
    fetchEmployees()

    setTimeout(() => {
      setShowRateModal(false)
      setFormSuccess("")
      setSelectedEmployee(null)
    }, 2000)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access denied. <Link href="/login" className="text-blue-600">Login as Employer</Link></p>
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
        <CheckCircle className="w-5 h-5 text-white" />
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
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
        {session.user.name?.[0] || "P"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
        <p className="text-xs text-slate-500">Project Manager</p>
      </div>
      <Link href="/login" className="text-slate-400 hover:text-red-500 transition">
        <LogOut className="w-5 h-5" />
      </Link>
    </div>
  </div>
</aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your team and give performance ratings</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-200"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
              <button onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                <Send className="w-4 h-4" /> Send Request
              </button>
              <NotificationBell />
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees yet</h3>
                <p className="text-slate-500 mb-6">Add your first team member to get started</p>
                <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
                  Add Employee
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {employees.map((emp, index) => (
                  <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                          ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-600" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{emp.fullName}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Briefcase className="w-4 h-4" />
                            {emp.jobTitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${emp.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                            emp.status === "INACTIVE" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"}`}>
                          {emp.status}
                        </span>
                        <button
                          onClick={() => openRateModal(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition"
                        >
                          <Star className="w-4 h-4" />
                          Rate
                        </button>
                        <button
                          onClick={() => openDeleteModal(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                       <a href={`mailto:${emp.email}`} className="truncate hover:text-blue-600 hover:underline transition" onClick={(e) => e.stopPropagation()}>
  {emp.email}
</a>
                      </div>
                      {emp.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {emp.phoneNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-5 h-5 ${star <= Math.round(emp.starRating ?? 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <span className="font-bold text-lg text-slate-900">{(emp.starRating ?? 0).toFixed(1)}</span>
                      <span className="text-sm text-slate-500">stars</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Request Modal — ADDED HERE */}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Employee</h3>
              <p className="text-slate-500 text-center mb-1">
                Are you sure you want to remove <span className="font-semibold text-slate-900">{selectedEmployee.fullName}</span>?
              </p>
              <p className="text-red-500 text-sm text-center mb-6">This will permanently delete their account and all associated data.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedEmployee(null); }}
                  className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteEmployee}
                  disabled={deleting}
                  className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? "Removing..." : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add New Employee</h3>
                  <p className="text-sm text-slate-500">Create a new team member account</p>
                </div>
              </div>
              <button onClick={() => { setShowAddModal(false); setFormError(""); }} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={createEmployee} className="p-6 space-y-5">
              {formError && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{formError}</div>}
              {formSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />{formSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewEmployee({ ...newEmployee, role: "EMPLOYEE" })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium ${newEmployee.role === "EMPLOYEE" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                    <User className="w-4 h-4" /> Employee
                  </button>
                  <button type="button" onClick={() => setNewEmployee({ ...newEmployee, role: "EMPLOYER" })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium ${newEmployee.role === "EMPLOYER" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                    <Shield className="w-4 h-4" /> Employer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input type="text" value={newEmployee.fullName} onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                  <input type="text" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@company.com" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" required minLength={6} />
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
                  <input type="text" value={newEmployee.jobTitle} onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Software Engineer" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input type="tel" value={newEmployee.phoneNumber} onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 234 567 890" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select value={newEmployee.status} onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setFormError(""); }}
                  className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? "Creating..." : (<><Plus className="w-4 h-4" />Create Employee</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Employee Modal */}
      {showRateModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Rate {selectedEmployee.fullName}</h3>
                  <p className="text-sm text-slate-500">Current rating: {selectedEmployee.starRating.toFixed(1)} stars</p>
                </div>
              </div>
              <button onClick={() => { setShowRateModal(false); setFormError(""); setSelectedEmployee(null); }} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={submitRating} className="p-6 space-y-5">
              {formError && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{formError}</div>}
              {formSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                  <Award className="w-4 h-4" />{formSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Star Rating Change</label>
                <div className="grid grid-cols-6 gap-2">
                  {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((amount) => (
                    <button key={amount} type="button" onClick={() => setRatingForm({ ...ratingForm, starChange: amount })}
                      className={`py-2.5 rounded-xl border-2 transition font-medium text-sm ${
                        ratingForm.starChange === amount
                          ? amount > 0 ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : amount < 0 ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-500 bg-slate-50 text-slate-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}>
                      {amount > 0 ? "+" : ""}{amount}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {ratingForm.starChange > 0 ? `Adding ${ratingForm.starChange} star${ratingForm.starChange > 1 ? 's' : ''}`
                    : ratingForm.starChange < 0 ? `Removing ${Math.abs(ratingForm.starChange)} star${Math.abs(ratingForm.starChange) > 1 ? 's' : ''}`
                    : "No change to rating"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                <select value={ratingForm.reason} onChange={(e) => setRatingForm({ ...ratingForm, reason: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="TASK_COMPLETION">Task Completion</option>
                  <option value="QUALITY_WORK">Quality of Work</option>
                  <option value="ATTENDANCE">Attendance & Punctuality</option>
                  <option value="TEAMWORK">Teamwork</option>
                  <option value="INITIATIVE">Initiative</option>
                  <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Feedback</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea value={ratingForm.description} onChange={(e) => setRatingForm({ ...ratingForm, description: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    rows={3} placeholder="Describe why you're giving this rating..." required />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowRateModal(false); setFormError(""); setSelectedEmployee(null); }}
                  className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? "Submitting..." : (<><TrendingUp className="w-4 h-4" />Submit Rating</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}