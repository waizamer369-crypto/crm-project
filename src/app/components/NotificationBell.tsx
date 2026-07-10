"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, AlertCircle, Send, Mail } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : []
        setNotifications(items)
        setUnreadCount(items.filter((n: Notification) => !n.read).length)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      fetchNotifications()
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const getIcon = (title: string) => {
    if (title.includes("Request")) return <Send className="w-4 h-4 text-blue-500" />
    if (title.includes("Approved")) return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (title.includes("Declined")) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Mail className="w-4 h-4 text-slate-500" />
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Mark all read
                  </button>
                )}
                <Link href="/requests" className="text-xs text-slate-500 hover:text-slate-700 font-medium" onClick={() => setOpen(false)}>
                  View All
                </Link>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${!n.read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(n.title)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}