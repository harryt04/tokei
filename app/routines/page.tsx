import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import RoutinesList from '@/components/custom/routines-list'

export default function Routines() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <RoutinesList />
      </SignedIn>
    </>
  )
}
