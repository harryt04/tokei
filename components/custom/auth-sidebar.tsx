'use client'

import { authClient } from '@/lib/auth-client'
import { AppSidebar } from '@/components/app-sidebar'

export function AuthSidebar() {
  const { data: session } = authClient.useSession()

  if (!session) return null

  return <AppSidebar />
}
