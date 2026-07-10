"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Layout, FolderKanban, User, MessageSquare, LogOut, StickyNote, Plus, Trash2, Loader2, PhoneCall } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function EmployeeNotes() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes")
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (err) {
      console.error("Failed to load notes:", err)
    } finally {
      setLoading(false)
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
              <h2 className="text-2xl font-bold text-slate-900">Notes</h2>
              <p className="text-sm text-slate-500 mt-1">Jot down anything you need to remember</p>
            </div>
          </header>

          <div className="flex h-[calc(100vh-89px)]">
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
        </main>
      </div>
    </div>
  )
}