"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { CheckCircle, Users, Calendar, MessageSquare, Send, LogOut, StickyNote, Plus, Trash2, Loader2, PhoneCall } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface AllNote extends Note {
  user: {
    id: string
    name: string | null
    email: string
    employeeCard?: { fullName: string | null; jobTitle: string | null }
  }
}

export default function EmployerNotes() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [tab, setTab] = useState<"mine" | "team">("mine")

  // My own notes
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  // Team notes (read-only)
  const [teamNotes, setTeamNotes] = useState<AllNote[]>([])
  const [teamLoading, setTeamLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
    fetchTeamNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes")
      if (res.ok) setNotes(await res.json())
    } catch (err) {
      console.error("Failed to load notes:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamNotes = async () => {
    try {
      const res = await fetch("/api/notes/all")
      if (res.ok) setTeamNotes(await res.json())
    } catch (err) {
      console.error("Failed to load team notes:", err)
    } finally {
      setTeamLoading(false)
    }
  }

  const selectNote = (note: Note) => {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
  }

  const newNote = () => {
    setSelected(null)
    setTitle("")
    setContent("")
  }

  const saveNote = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      if (selected) {
        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selected.id, title, content })
        })
        if (res.ok) {
          const updated = await res.json()
          setNotes(notes.map(n => n.id === updated.id ? updated : n))
          setSelected(updated)
        }
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content })
        })
        if (res.ok) {
          const created = await res.json()
          setNotes([created, ...notes])
          setSelected(created)
        }
      }
    } catch (err) {
      console.error("Failed to save note:", err)
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id))
        if (selected?.id === id) newNote()
      }
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  const getName = (u: AllNote["user"]) => u.employeeCard?.fullName || u.name || u.email

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access denied</p>
          <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
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

        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Notes</h2>
              <p className="text-sm text-slate-500 mt-1">Your notes and your team's notes</p>
            </div>
          </header>

          <div className="p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab("mine")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${tab === "mine" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                My Notes
              </button>
              <button
                onClick={() => setTab("team")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${tab === "team" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Employee Notes
              </button>
            </div>

            {tab === "mine" ? (
              <div className="bg-white rounded-2xl border border-slate-200 flex h-[calc(100vh-260px)] overflow-hidden">
                {/* Notes list */}
                <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
                  <div className="p-4 border-b border-slate-100">
                    <button
                      onClick={newNote}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      New Note
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <StickyNote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No notes yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notes.map(note => (
                          <button
                            key={note.id}
                            onClick={() => selectNote(note)}
                            className={`w-full flex items-start justify-between gap-2 px-4 py-4 hover:bg-slate-50 transition text-left ${
                              selected?.id === note.id ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900 truncate">{note.title}</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{note.content || "No content"}</p>
                              <p className="text-xs text-slate-400 mt-1">{format(new Date(note.updatedAt), "MMM d, yyyy")}</p>
                            </div>
                            <span
                              onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                              className="text-slate-300 hover:text-red-500 transition shrink-0 mt-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-6 flex flex-col">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    className="text-xl font-bold text-slate-900 outline-none mb-4 placeholder:text-slate-300"
                  />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing..."
                    className="flex-1 outline-none resize-none text-slate-700 placeholder:text-slate-300"
                  />
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={saveNote}
                      disabled={saving || !title.trim()}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
                    >
                      {saving ? "Saving..." : selected ? "Update Note" : "Save Note"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {teamLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : teamNotes.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No notes from anyone yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamNotes.map(note => (
                      <div key={note.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                            {getName(note.user)[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-slate-500 truncate">{getName(note.user)}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{note.title}</h4>
                        <p className="text-sm text-slate-500 whitespace-pre-wrap line-clamp-4">{note.content || "No content"}</p>
                        <p className="text-xs text-slate-400 mt-3">{format(new Date(note.updatedAt), "MMM d, yyyy")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}