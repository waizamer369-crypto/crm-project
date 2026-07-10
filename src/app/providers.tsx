"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      baseUrl={process.env.NEXTAUTH_URL || "http://localhost:3000"}
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  )
}