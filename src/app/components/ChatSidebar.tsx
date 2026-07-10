"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MessageSquare, X, ChevronLeft, Loader2, Briefcase } from "lucide-react"
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

interface ChatSidebarProps {
  open: boolean
  onClose: () => void
}

export function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<ChatProject[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ChatProject | null>(null)

  useEffect(() => {
    if (open) fetchList()
  }, [open])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/chat/list")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (err) {
      console.error("Failed to load chat list:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) return null

  return (
    <>
      {/* Backdrop on small screens */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={onClose} />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white border-l border-slate-200 shadow-2xl z-30 transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-200 shrink-0">
          {selected && (
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h3 className="font-bold text-slate-900 flex-1 truncate">
            {selected ? selected.name : "Chats"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-4">
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
          ) : loading ? (
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
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition text-left"
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
    </>
  )
}