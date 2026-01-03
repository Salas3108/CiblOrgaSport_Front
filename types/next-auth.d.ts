import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    roles?: string[]
    // ...add any other user fields you use...
  }

  interface Session {
    user?: {
      role?: string
      roles?: string[]
      // ...mirror fields needed in session.user...
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[]
  }
}
