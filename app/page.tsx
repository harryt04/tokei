import { LandingPage } from '@/components/custom/landing-page'
import { Sidebar } from '@/components/custom/nav-drawer'
import { cn } from '@/lib/utils'
import { SignedIn, SignedOut } from '@clerk/nextjs'

export default async function Home() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-4 px-10 py-20',
          )}
        >
          <Sidebar playlists={['playlist1', 'playlist2', 'playlist3']} />
        </div>
        {/* <div
          className={cn(
            'flex min-h-screen flex-col items-center justify-center gap-4 px-10 py-20',
          )}
        >
          <DateTimePickerForm />
        </div> */}
      </SignedIn>
    </>
  )
}
