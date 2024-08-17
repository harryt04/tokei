import Link from 'next/link'
import { ThemeSwitcher } from './themeSwitcher'
import { Button } from '../ui/button'

function LandingPage() {
  return (
    <div>
      <ThemeSwitcher />
      {/* vertical and horizontal center */}
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center justify-center max-w-2xl">
          <h1 className="text-4xl font-bold"> Tokei </h1>
          <br />
          <p className="text-l">
            Tokei is the ultimate timer app for power users, designed for chefs
            in the kitchen, fitness instructors, and project managers who need
            to set precise, sequential routines to keep everything on track.
          </p>
          <br />
          <br />

          <p className="text-l">
            Coming soon.{' '}
            <Button variant={'link'}>
              <Link href="https://forms.gle/zgnPSaAiiLh7AuCz5">
                Join the waitlist here.
              </Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}

export { LandingPage }
