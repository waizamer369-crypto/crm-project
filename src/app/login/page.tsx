"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Briefcase, User, Lock, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"EMPLOYER" | "EMPLOYEE">("EMPLOYEE")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    if (role === "EMPLOYER") {
      router.push("/employer/projects")
    } else {
      router.push("/employee/calendar")
    }
  }

  const quickLogin = (emailVal: string, passVal: string, roleVal: "EMPLOYER" | "EMPLOYEE") => {
    setEmail(emailVal)
    setPassword(passVal)
    setRole(roleVal)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative z-10 text-center text-white px-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Briefcase className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">CRM Pro</h1>
          <p className="text-blue-100 text-lg max-w-md">Streamline your projects, track performance, and manage your team efficiently.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:hidden">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account</p>
          </div>

          {/* Role Toggle */}
          <div className="flex mb-8 bg-slate-100 rounded-2xl p-1.5">
            <button
              onClick={() => setRole("EMPLOYER")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                role === "EMPLOYER"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Employer
            </button>
            <button
              onClick={() => setRole("EMPLOYEE")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                role === "EMPLOYEE"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <User className="w-4 h-4" />
              Employee
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? "Signing in..." : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Login (Demo)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin("employer@company.com", "password123", "EMPLOYER")}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-slate-100 transition"
              >
                <p className="text-xs text-slate-400 mb-1">Employer</p>
                <p className="text-sm font-medium text-slate-700 truncate">employer@company.com</p>
              </button>
              <button
                onClick={() => quickLogin("john@company.com", "password123", "EMPLOYEE")}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-slate-100 transition"
              >
                <p className="text-xs text-slate-400 mb-1">Employee</p>
                <p className="text-sm font-medium text-slate-700 truncate">john@company.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
