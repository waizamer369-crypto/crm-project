"use client"

export const dynamic = "force-dynamic"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, MicOff, PhoneOff, Loader2, Users } from "lucide-react"

interface Participant {
  user: { id: string; name: string | null; email: string }
}

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }

export default function MeetingRoom() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string

  const [meetingTitle, setMeetingTitle] = useState("")
  const [joining, setJoining] = useState(true)
  const [muted, setMuted] = useState(false)
  const [connectedIds, setConnectedIds] = useState<string[]>([])
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioElsRef = useRef<Record<string, HTMLAudioElement>>({})

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (cancelled) return
        localStreamRef.current = stream

        const detailRes = await fetch(`/api/meetings/${meetingId}`)
        if (!detailRes.ok) throw new Error("Meeting not found")
        const detail = await detailRes.json()
        setMeetingTitle(detail.title)

        const joinRes = await fetch(`/api/meetings/${meetingId}/join`, { method: "POST" })
        if (!joinRes.ok) throw new Error("Failed to join")
        const { existingParticipants } = await joinRes.json()

        const names: Record<string, string> = {}
        existingParticipants.forEach((p: Participant) => {
          names[p.user.id] = p.user.name || p.user.email
        })
        setParticipantNames(names)

        // Initiate a connection + offer to each existing participant
        for (const p of existingParticipants) {
          await createPeerAndOffer(p.user.id)
        }

        setJoining(false)
        pollRef.current = setInterval(pollSignals, 1200)
      } catch (err) {
        console.error("Failed to start meeting:", err)
        setError("Couldn't access your microphone, or the meeting could not be joined.")
        setJoining(false)
      }
    }

    start()

    return () => {
      cancelled = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId])

  const createPeerConnection = (remoteUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!)
    })

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(remoteUserId, "candidate", e.candidate.toJSON())
      }
    }

    pc.ontrack = (e) => {
      let audioEl = audioElsRef.current[remoteUserId]
      if (!audioEl) {
        audioEl = new Audio()
        audioEl.autoplay = true
        audioElsRef.current[remoteUserId] = audioEl
      }
      audioEl.srcObject = e.streams[0]
      setConnectedIds(prev => prev.includes(remoteUserId) ? prev : [...prev, remoteUserId])
    }

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        removePeer(remoteUserId)
      }
    }

    peersRef.current[remoteUserId] = pc
    return pc
  }

  const createPeerAndOffer = async (remoteUserId: string) => {
    const pc = createPeerConnection(remoteUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await sendSignal(remoteUserId, "offer", offer)
  }

  const sendSignal = async (toUserId: string, type: string, payload: any) => {
    try {
      await fetch(`/api/meetings/${meetingId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, type, payload })
      })
    } catch (err) {
      console.error("Failed to send signal:", err)
    }
  }

  const pollSignals = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/signal`)
      if (!res.ok) return
      const signals = await res.json()

      for (const sig of signals) {
        const { fromUserId, type, payload } = sig

        if (type === "offer") {
          let pc = peersRef.current[fromUserId]
          if (!pc) pc = createPeerConnection(fromUserId)
          await pc.setRemoteDescription(new RTCSessionDescription(payload))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await sendSignal(fromUserId, "answer", answer)
        } else if (type === "answer") {
          const pc = peersRef.current[fromUserId]
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload))
        } else if (type === "candidate") {
          const pc = peersRef.current[fromUserId]
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload))
            } catch (err) {
              console.error("Failed to add ICE candidate:", err)
            }
          }
        } else if (type === "leave") {
          removePeer(fromUserId)
        }
      }
    } catch (err) {
      console.error("Poll signals error:", err)
    }
  }

  const removePeer = (userId: string) => {
    const pc = peersRef.current[userId]
    if (pc) {
      pc.close()
      delete peersRef.current[userId]
    }
    const audioEl = audioElsRef.current[userId]
    if (audioEl) {
      audioEl.srcObject = null
      delete audioElsRef.current[userId]
    }
    setConnectedIds(prev => prev.filter(id => id !== userId))
  }

  const cleanup = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    Object.values(peersRef.current).forEach(pc => pc.close())
    peersRef.current = {}
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    fetch(`/api/meetings/${meetingId}/leave`, { method: "POST" }).catch(() => {})
  }

  const toggleMute = () => {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach(track => {
      track.enabled = muted // if currently muted, enable; else disable
    })
    setMuted(!muted)
  }

  const leaveMeeting = () => {
    cleanup()
    router.push("/employer/meetings")
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
      {joining ? (
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Joining meeting...</p>
        </div>
      ) : error ? (
        <div className="text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/employer/meetings" className="text-blue-400 hover:underline">
            Back to Meetings
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold mb-1">{meetingTitle}</h1>
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {connectedIds.length + 1} in call
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-12 max-w-2xl">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
              {session.user.name?.[0] || "Y"}
            </div>
            {connectedIds.map(id => (
              <div key={id} className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold">
                {(participantNames[id] || "?")[0]?.toUpperCase()}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                muted ? "bg-white text-slate-900" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={leaveMeeting}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}