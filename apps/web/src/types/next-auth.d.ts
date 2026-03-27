import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'SALES' | 'BUILD'
      isOnboarded: boolean
      firstName?: string | null
      lastName?: string | null
      nickname?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'SALES' | 'BUILD'
    isOnboarded?: boolean
    firstName?: string | null
    lastName?: string | null
    nickname?: string | null
  }
}
