'use client'
import { LandingPage } from '@/components/custom/landing-page'
import { SideNav } from '@/components/custom/side-nav'
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user } = useClerk()
  const router = useRouter()

  if (user) {
    router.push('/routines')
  }
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  )
}
