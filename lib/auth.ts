// lib/auth.ts
// Configuration NextAuth v5 (next-auth@5.x beta).
// AUTH_SECRET est lu depuis .env.local (requis en v5).
// L'authentification principale passe par components/auth/auth-provider.tsx
// (JWT Spring Boot stocké dans localStorage). NextAuth est conservé pour
// la compatibilité avec SessionProvider et les helpers session SSR.

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const nextAuth = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "text"     },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Fallback local uniquement — la vraie auth passe par Spring Boot
        if (credentials?.email) {
          return {
            id:    "1",
            name:  String(credentials.email),
            email: String(credentials.email),
          }
        }
        return null
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id
      return session
    },
  },

  pages: { signIn: "/login" },
})

export const { handlers, auth, signIn, signOut } = nextAuth
// Réexporte GET et POST pour src/app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = nextAuth.handlers
