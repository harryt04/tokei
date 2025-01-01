'use client'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { RedirectToSignIn, SignedOut } from '@clerk/nextjs'

export default function Routines() {
  const { open, isMobile } = useSidebar()
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      {(!open || isMobile) && <SidebarTrigger className="ml-2 mt-5 p-5" />}
    </>
  )
}
