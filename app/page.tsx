'use client'
import { useEffect } from 'react'
import { LandingPage } from '@/components/custom/landing-page'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/freestyle')
    }
  }, [session, router])

  if (isPending || session) return null

  return <LandingPage />
}
