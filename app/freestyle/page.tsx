import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import MySidebarTrigger from '@/components/custom/sidebar-trigger'
import FreestyleList from '@/components/custom/freestyle-list'

export default function Freestyle() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <MySidebarTrigger />
        <FreestyleList />
      </SignedIn>
    </>
  )
}
