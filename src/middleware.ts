import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow login page without auth
    if (path === "/login" || path.startsWith("/api/auth")) {
      return NextResponse.next()
    }

    // No token = redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role checks
    if (path.startsWith("/employer") && token.role !== "EMPLOYER") {
      return NextResponse.redirect(new URL("/employee/calendar", req.url))
    }

    if (path.startsWith("/employee") && token.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/employer/projects", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (req.nextUrl.pathname === "/login") return true
        return token !== null
      }
    },
    pages: {
      signIn: "/login"
    }
  }
)

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"]
}