"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { 
  MessageSquare, 
  Send, 
  Users, 
  Plus, 
  X, 
  Loader2
} from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    employeeCard?: { fullName: string | null }
  }
}

interface ChatMember {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    employeeCard?: { fullName: string | null; jobTitle: string | null }
  }
}

interface ProjectMember {
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    role?: string
  }
}

interface ProjectChatProps {
  projectId: string
  projectMembers: ProjectMember[]
}

export function ProjectChat({ projectId, projectMembers }: ProjectChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<ChatMember[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChat()
    const interval = setInterval(fetchChat, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/chat?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, content: newMessage.trim() })
      })

      if (res.ok) {
        setNewMessage("")
        fetchChat()
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  const addMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        fetchChat()
        setShowAddMember(false)
      }
    } catch (err) {
      console.error("Failed to add member:", err)
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member from chat?")) return

    try {
      const res = await fetch(`/api/projects/${projectId}/chat-members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        fetchChat()
      }
    } catch (err) {
      console.error("Failed to remove member:", err)
    }
  }

  const getMemberName = (member: ChatMember | ChatMessage["sender"]) => {
    if ("user" in member) {
      return member.user.employeeCard?.fullName || member.user.name || member.user.email.split("@")[0]
    }
    return member.employeeCard?.fullName || member.name || member.email.split("@")[0]
  }

  const nonChatMembers = projectMembers.filter(
    pm => !members.some(m => m.userId === pm.userId)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Project Chat</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Users className="w-3 h-3" />
            {members.length}
          </button>
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="border-b border-slate-100 p-3 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-slate-700">Chat Members</h4>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          
          {showAddMember && nonChatMembers.length > 0 && (
            <div className="mb-2 p-2 bg-white rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Add project members:</p>
              <div className="space-y-1">
                {nonChatMembers.map(pm => (
                  <button
                    key={pm.userId}
                    onClick={() => addMember(pm.userId)}
                    className="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-slate-50 rounded transition text-left"
                  >
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {pm.user.name?.[0] || "?"}
                    </div>
                    <span className="flex-1 truncate">{pm.user.name || pm.user.email}</span>
                    <Plus className="w-3 h-3 text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {member.user.name?.[0] || "?"}
                </div>
                <span className="text-xs text-slate-700 flex-1">
                  {getMemberName(member)}
                </span>
                {member.userId !== session?.user?.id && (
                  <button
                    onClick={() => removeMember(member.userId)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No messages yet. Start chatting!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === session?.user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"} rounded-2xl px-3 py-2`}>
                  {!isMe && (
                    <p className="text-xs font-medium opacity-70 mb-0.5">
                      {getMemberName(msg.sender)}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
          >
            {sending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}