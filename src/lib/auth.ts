import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        console.log("AUTHORIZING:", credentials?.email)
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) return null

        console.log("USER FOUND:", user.email, "ROLE:", user.role)

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
console.log("JWT CALLBACK - user:", (user as any)?.role, "token before:", (token as any).role)
      if (user) {
        token.id = user.id
   token.role = (user as any).role
      }
      console.log("JWT CALLBACK - token after:", token.role)
      return token
    },
    async session({ session, token }) {
      console.log("SESSION CALLBACK - token.role:", token.role, "token.sub:", token.sub)
      if (token) {
        session.user.id = token.sub as string || token.id as string
        session.user.role = token.role as string
      }
      console.log("SESSION CALLBACK - session.user:", session.user)
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}