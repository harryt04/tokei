import Link from 'next/link'
import { ThemeSwitcher } from './themeSwitcher'
import { Button } from '../ui/button'

function LandingPage() {
  return (
    <div>
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <div className="flex max-w-2xl flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">時計 Tokei </h1>
          <br />
          <ThemeSwitcher />
          <br />
          <p className="text-l max-w-md text-center">
            Tokei (時計, &quot;clock&quot; in Japanese) is a free and open
            source, timer app for power users. It&apos;s designed for chefs in
            the kitchen, fitness instructors, and project managers who need
            precise, sequential routines to keep everything on track.
          </p>
          <br />
          <br />
          <Button variant={'link'}>
            <Link href="/login">Sign in to the free and open beta</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { LandingPage }
