import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import { db } from "./db"
import bcrypt from "bcryptjs"

// Conditionally add OAuth providers only if credentials are configured
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const user = await db.user.findUnique({
        where: { email: credentials.email },
      })

      if (!user || !user.passwordHash) return null
      if (user.suspended) return null

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
      if (!isValid) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      }
    },
  }),
]

// Google OAuth — only if credentials are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

// Apple OAuth — only if credentials are set
if (process.env.APPLE_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_PRIVATE_KEY && process.env.APPLE_KEY_ID) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: {
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        keyId: process.env.APPLE_KEY_ID,
      },
      allowDangerousEmailAccountLinking: true,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in (Google, Apple, etc.)
      if (account?.type === "oauth" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create new user from OAuth profile
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              image: user.image,
              role: "user_free",
            },
          })
        } else if (existingUser.suspended) {
          // Block suspended users
          return false
        }
        // If user exists and not suspended, allow sign-in
      }
      return true
    },

    async jwt({ token, user, account }) {
      // On initial sign-in (including OAuth), look up user in DB
      if (user) {
        // For OAuth users, find by email since id might not be from our DB
        if (account?.type === "oauth" && user.email) {
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
          }
        } else {
          // Credentials sign-in
          token.role = (user as any).role
          token.id = user.id
        }
      }

      // Refresh role from DB on each JWT refresh
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      } else if (token.email) {
        // Fallback: look up by email if id is missing
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "crypto-tracker-secret-key-2024",
}
