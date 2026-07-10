"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Send, Mail, Check, X, Clock, ArrowLeft, ArrowRight, LogOut, User, Briefcase } from "lucide-react"
import { NotificationBell } from "@/app/components/NotificationBell"
import { RequestModal } from "@/app/components/RequestModal"

interface Request {
  id: string
  sender: { id: string; name: string | null; email: string }
  receiver: { id: string; name: string | null; email: string }
  type: string
  title: string
  message: string | null
  status: string
  createdAt: string
}

export default function RequestsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    const res = await fetch(`/api/requests?type=${activeTab}`)
    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }

  const handleAction = async (requestId: string, action: "ACCEPT" | "DECLINE") => {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    })
    if (res.ok) fetchRequests()
  }

  const isEmployer = session?.user?.role === "EMPLOYER"
  const basePath = isEmployer ? "/employer" : "/employee"

  if (!session?.user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar - copy from your existing pages */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CRM Pro</h1>
                <p className="text-xs text-slate-500">{isEmployer ? "Project Manager" : "My Workspace"}</p>
              </div>
            </div>
            <nav className="space-y-1">
              <Link href={`${basePath}/projects`} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                <Briefcase className="w-5 h-5" /> {isEmployer ? "Projects" : "My Projects"}
              </Link>
              <Link href={`${basePath}/requests`} className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
                <Send className="w-5 h-5" /> Requests
              </Link>
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {session.user.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{session.user.name}</p>
                <p className="text-xs text-slate-500">{session.user.role}</p>
              </div>
              <Link href="/login" className="text-slate-400 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your sent and received requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm">
                <Send className="w-4 h-4" /> Send Request
              </button>
              <NotificationBell />
            </div>
          </header>

          <div className="p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveTab("received")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "received" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                Received Requests
              </button>
              <button onClick={() => setActiveTab("sent")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "sent" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                Sent Requests
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No {activeTab} requests</h3>
                <p className="text-slate-500 mb-4">{activeTab === "received" ? "No one has sent you a request yet" : "You haven't sent any requests yet"}</p>
                <button onClick={() => setShowRequestModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
                  Send a Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            req.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                            req.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-xs text-slate-400 uppercase font-medium">{req.type.replace("_", " ")}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">{req.title}</h4>
                        {req.message && <p className="text-sm text-slate-500 mb-3">{req.message}</p>}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          {activeTab === "received" ? (
                            <><ArrowLeft className="w-4 h-4" /> From: <strong>{req.sender.name || req.sender.email}</strong></>
                          ) : (
                            <><ArrowRight className="w-4 h-4" /> To: <strong>{req.receiver.name || req.receiver.email}</strong></>
                          )}
                          <span className="text-slate-300">|</span>
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {activeTab === "received" && req.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(req.id, "ACCEPT")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium">
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button onClick={() => handleAction(req.id, "DECLINE")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium">
                            <X className="w-4 h-4" /> Decline
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
      {showRequestModal && <RequestModal onClose={() => { setShowRequestModal(false); fetchRequests() }} />}
    </div>
  )
}