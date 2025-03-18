'use client'

import { RedirectToSignIn, SignedOut, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function LoginCard() {
  const { user } = useClerk()
  const router = useRouter()

  if (user) {
    router.push('/freestyle')
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export { LoginCard }
