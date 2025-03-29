import Link from 'next/link'
import { ThemeSwitcher } from './themeSwitcher'
import { Button } from '../ui/button'

function LandingPage() {
  return (
    <div>
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <div className="flex max-w-2xl flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">Tokei 時計 </h1>
          <br />
          <ThemeSwitcher />
          <br />
          <p className="text-l max-w-md px-8 text-center md:p-0">
            Tokei (時計, meaning &quot;clock&quot; in Japanese) is a free,
            open-source timer app built for power users. Designed specifically
            for chefs in the kitchen, it helps manage multiple timers
            simultaneously, ensuring all dishes are finished at the perfect
            moment.
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
