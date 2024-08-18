import { LandingPage } from '@/components/custom/landing-page'
import { DateTimePickerForm } from '@/components/time-picker/date-time-picker-form'
import { cn } from '@/lib/utils'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'

export default async function Home() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div
          className={cn(
            'flex min-h-screen flex-col items-center justify-center gap-4 px-10 py-20',
          )}
        >
          <DateTimePickerForm />
        </div>
      </SignedIn>
    </>
  )
}
