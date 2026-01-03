import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace with real verification. Demo user below:
        if (credentials?.email) {
          return {
            id: "1",
            name: "Arthur Dubois",
            email: credentials.email,
            // Add roles so ProtectedRoute can use them
            roles: ["official"],
          } as any
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as any).roles ?? []
      }
      return token
    },
    async session({ session, token }) {
      // Harden session to avoid runtime errors
      session.user = session.user ?? ({} as any)
      ;(session.user as any).roles = (token as any).roles ?? []
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
} as const

// v5 pattern: create handlers and auth helper once and re-export
export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(authOptions)
