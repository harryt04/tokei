'use client'
import { useEffect } from 'react'
import { LandingPage } from '@/components/custom/landing-page'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/freestyle')
    }
  }, [session, router])

  // Render the landing page while the session is still loading so its content
  // is part of the server-rendered HTML (LCP and crawlers); signed-in users are
  // redirected by the effect above.
  if (session) return null

  return <LandingPage />
}
