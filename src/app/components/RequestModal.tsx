"use client"

import { useState, useEffect } from "react"
import { X, Send, Loader2 } from "lucide-react"

interface UserOption {
  id: string
  name: string | null
  email: string
  role: string
  employeeCard?: { fullName: string | null; jobTitle: string | null }
}

interface RequestModalProps {
  onClose: () => void
}

const REQUEST_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "TIME_OFF", label: "Time Off" },
  { value: "EXPENSE", label: "Expense" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OTHER", label: "Other" },
]

export function RequestModal({ onClose }: RequestModalProps) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    type: "GENERAL",
    title: "",
    description: "",
    receiverId: "",
  })

  useEffect(() => {
    fetch("/api/requests?type=users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setLoadingUsers(false))
  }, [])

  const getUserLabel = (u: UserOption) => {
    const displayName = u.employeeCard?.fullName || u.name || u.email
    return u.employeeCard?.jobTitle ? `${displayName} — ${u.employeeCard.jobTitle}` : displayName
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.receiverId) {
      setError("Please select who to send this to")
      return
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to send request")
        return
      }

      onClose()
    } catch (err) {
      console.error("Failed to send request:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">Send Request</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Send to</label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading people...
              </div>
            ) : (
              <select
                value={form.receiverId}
                onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select a person...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUserLabel(u)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief title for your request"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Give some details..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}