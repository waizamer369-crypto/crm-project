"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, Calendar, User, LogOut, CheckCircle, Layout, MessageSquare, StickyNote, PhoneCall } from "lucide-react"
import { ChatPageContent } from "@/app/components/ChatPageContent"

export default function EmployeeChatPage() {
  const { data: session } = useSession()
  const pathname = usePathname()

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
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

        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Chat</h2>
              <p className="text-sm text-slate-500 mt-1">Message your team about a project</p>
            </div>
          </header>

          <ChatPageContent />
        </main>
      </div>
    </div>
  )
}