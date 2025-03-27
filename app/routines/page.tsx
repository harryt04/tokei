import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import RoutinesList from '@/components/custom/routines-list'
import { fetchRoutines } from '@/lib/api'

export default async function Routines() {
  // Pre-fetch routines at the server level
  const initialRoutines = await fetchRoutines().catch(() => [])
  console.log('initialRoutines: ', initialRoutines)

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <RoutinesList initialRoutines={initialRoutines} />
      </SignedIn>
    </>
  )
}
