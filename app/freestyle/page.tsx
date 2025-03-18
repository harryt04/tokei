import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import FreestyleComponent from '@/components/custom/freestyle-component'
import MySidebarTrigger from '@/components/custom/sidebar-trigger'

export default function Freestyle() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <MySidebarTrigger />
        <FreestyleComponent />
      </SignedIn>
    </>
  )
}
