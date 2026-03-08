'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function LoginCard() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/freestyle')
    } else if (!isPending) {
      router.push('/sign-in')
    }
  }, [session, isPending, router])

  return null
}

export { LoginCard }
