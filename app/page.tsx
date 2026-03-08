'use client'
import { LandingPage } from '@/components/custom/landing-page'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) return null

  if (session) {
    router.push('/freestyle')
    return null
  }

  return <LandingPage />
}
