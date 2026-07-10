"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Briefcase, MessageSquare } from "lucide-react"
import { ProjectChat } from "@/app/components/ProjectChat"

interface ChatProject {
  id: string
  name: string
  status?: string
  members: {
    userId: string
    user: { id: string; name: string | null; email: string; role?: string }
  }[]
}

export function ChatPageContent() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<ChatProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChatProject | null>(null)

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/chat/list")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        // Auto-select the first project on desktop so the page isn't empty
        if (data.length > 0) setSelected((prev: ChatProject | null) => prev ?? data[0])
      }
    } catch (err) {
      console.error("Failed to load chat list:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) return null

  return (
    <div className="flex h-[calc(100vh-89px)] bg-white">
      {/* Left: project list */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Chats</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {session.user.role === "EMPLOYER"
                  ? "No projects yet"
                  : "You haven't been added to any project chats yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition text-left ${
                    selected?.id === p.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                    {p.name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.members.length} member{p.members.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: conversation */}
      <div className="flex-1 p-6 overflow-hidden">
        {selected ? (
          <div className="h-full max-w-2xl mx-auto">
            <ProjectChat
              projectId={selected.id}
              projectMembers={selected.members.map(m => ({
                userId: m.userId,
                user: {
                  id: m.user.id,
                  name: m.user.name,
                  email: m.user.email,
                  role: m.user.role
                }
              }))}
            />
          </div>
        ) : (
          !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">Select a chat to start messaging</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}