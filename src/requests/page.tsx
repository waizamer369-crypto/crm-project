// src/app/requests/page.tsx
"use client"

import { useState, useEffect, FormEvent } from "react"
import { useSession } from "next-auth/react"
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Inbox,
  Mail,  // or use Send instead of Outbox
  Search,
  Loader2
} from "lucide-react"

interface Request {
  id: string
  type: string
  title: string
  description: string
  status: string
  response: string | null
  createdAt: string
  employeeId: string
  receiverId: string
  employee: {
    id: string
    name: string | null
    email: string
    employeeCard?: { fullName: string | null; jobTitle: string | null }
  }
  receiver: {
    id: string
    name: string | null
    email: string
    employeeCard?: { fullName: string | null; jobTitle: string | null }
  }
}

interface RequestModalProps {
  onClose: () => void
  onRequestSent?: () => void
}

type RequestUser = {
  id: string
  name: string | null
  email: string
  employeeCard?: { fullName: string | null; jobTitle: string | null }
}

function RequestModal({ onClose, onRequestSent }: RequestModalProps) {
  const [users, setUsers] = useState<RequestUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState("OTHER")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [receiverId, setReceiverId] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const res = await fetch("/api/requests?type=users")
        if (res.ok) {
          const data = await res.json()
          setUsers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error("Failed to fetch users:", err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!receiverId) {
      setError("Please select a recipient")
      return
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required")
      return
    }

    setError(null)
    setSending(true)

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          receiverId,
        }),
      })

      if (res.ok) {
        onRequestSent?.()
        onClose()
        return
      }

      const data = await res.json()
      setError(data?.error || "Failed to send request")
    } catch (err) {
      console.error("Failed to send request:", err)
      setError("Failed to send request")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Send Request</h2>
            <p className="text-sm text-slate-500">Create a new request for a team member.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Recipient</label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select recipient</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.employeeCard?.fullName || user.name || user.email}
                </option>
              ))}
            </select>
            {loadingUsers && <p className="mt-2 text-sm text-slate-500">Loading users...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Request Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="OTHER">Other</option>
              <option value="GENERAL">General</option>
              <option value="BUDGET">Budget</option>
              <option value="TIME_OFF">Time Off</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Request title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Provide details for your request"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing" | "pending">("all")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (id: string, status: "APPROVED" | "DECLINED") => {
    if (!responseText.trim() && status === "DECLINED") {
      alert("Please provide a reason for declining")
      return
    }

    setActionLoading(id)
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, response: responseText.trim() || undefined })
      })

      if (res.ok) {
        setRespondingTo(null)
        setResponseText("")
        fetchRequests()
      }
    } catch (err) {
      console.error("Failed to respond:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "DECLINED": return "bg-red-100 text-red-700 border-red-200"
      default: return "bg-amber-100 text-amber-700 border-amber-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle className="w-4 h-4" />
      case "DECLINED": return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const filteredRequests = requests.filter(r => {
    const isIncoming = r.receiverId === session?.user?.id
    const isOutgoing = r.employeeId === session?.user?.id
    
    if (filter === "incoming") return isIncoming
    if (filter === "outgoing") return isOutgoing
    if (filter === "pending") return r.status === "PENDING"
    return true
  })

  const pendingCount = requests.filter(r => r.status === "PENDING" && r.receiverId === session?.user?.id).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="text-slate-500">Manage your incoming and outgoing requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Send className="w-4 h-4" />
          Send Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {requests.filter(r => r.receiverId === session?.user?.id).length}
              </p>
              <p className="text-sm text-slate-500">Received</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {requests.filter(r => r.employeeId === session?.user?.id).length}
              </p>
              <p className="text-sm text-slate-500">Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "incoming", label: "Incoming" },
          { key: "outgoing", label: "Outgoing" },
          { key: "pending", label: "Pending" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const isIncoming = request.receiverId === session?.user?.id
            const isPending = request.status === "PENDING"
            const otherPerson = isIncoming ? request.employee : request.receiver

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {request.type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {request.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      {request.description}
                    </p>

                    {/* Show response if exists */}
                    {request.response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <strong>Response:</strong> {request.response}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">
                        {otherPerson?.employeeCard?.fullName?.[0] || otherPerson?.name?.[0] || "?"}
                      </div>
                      <span>
                        {isIncoming ? "From" : "To"}: {otherPerson?.employeeCard?.fullName || otherPerson?.name || "Unknown"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{otherPerson?.email}</span>
                    </div>
                  </div>

                  {/* Action buttons for incoming pending requests */}
                  {isIncoming && isPending && (
                    <div className="flex flex-col gap-2 ml-4">
                      {respondingTo === request.id ? (
                        <div className="w-80 space-y-3">
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Add a response message (optional for approve, required for decline)..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResponse(request.id, "APPROVED")}
                              disabled={actionLoading === request.id}
                              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleResponse(request.id, "DECLINED")}
                              disabled={actionLoading === request.id}
                              className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                setRespondingTo(null)
                                setResponseText("")
                              }}
                              className="px-3 py-2 text-slate-500 text-sm hover:bg-slate-100 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(request.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Respond
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && <RequestModal onClose={() => setShowModal(false)} />}
    </div>
  )
}