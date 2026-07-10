"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Inbox, CheckCircle, XCircle, Clock, ArrowLeft, Mail, User, Calendar, LogOut, Briefcase, Send, Users, StickyNote, MessageSquare, PhoneCall } from "lucide-react"

interface Request {
  id: string
  type: string
  title: string
  description: string
  status: string
  createdAt: string
  employee: { fullName: string; email: string }
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700"
}

export default function EmployerRequests() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetch("/api/requests")
        .then((res) => res.json())
        .then((data) => {
          setRequests(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Access denied. <Link href="/login" className="text-blue-600">Login</Link></p>
      </div>
    )
  }

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
              <h2 className="text-2xl font-bold text-slate-900">Employee Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Review and manage employee requests</p>
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests yet</h3>
                <p className="text-slate-500">Employee requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || "bg-slate-100 text-slate-600"}`}>
                            {req.status}
                          </span>
                          <span className="text-xs text-slate-400">{format(new Date(req.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">{req.title}</h3>
                        <p className="text-sm text-slate-500 mb-3">{req.description}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span>{req.employee?.fullName || "Unknown"} ({req.employee?.email || "No email"})</span>
                        </div>
                      </div>
                      {req.status === "PENDING" && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => updateStatus(req.id, "APPROVED")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, "REJECTED")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}