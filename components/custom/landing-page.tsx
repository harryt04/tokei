import Link from 'next/link'
import { ThemeSwitcher } from './themeSwitcher'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Timer } from 'lucide-react' // Assuming lucide-react for icons

function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header/Nav Placeholder */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Tokei 時計</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32">
          <div className="container grid place-items-center gap-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Master Your Time with Tokei 時計
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Tokei (時計, meaning &quot;clock&quot; in Japanese) is a free,
              open-source timer app built for power users. Designed specifically
              for chefs, it helps manage multiple timers simultaneously.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/login">
                  <Timer />
                  Start Timing Now
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com/harryt04/tokei" // Replace with your actual repo link
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full bg-slate-50/50 py-12 dark:bg-transparent lg:py-24"
        >
          <div className="container space-y-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
                Features
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Built for efficiency and precision in demanding environments.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              {/* Feature Card 1 */}
              <Card>
                <CardHeader>
                  <CardTitle>Multiple Timers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Easily manage numerous timers at once, perfect for complex
                    tasks like cooking multiple dishes.
                  </p>
                </CardContent>
              </Card>
              {/* Feature Card 2 */}
              <Card>
                <CardHeader>
                  <CardTitle>Intuitive Interface</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Designed for quick glances and easy operation, even with
                    messy hands.
                  </p>
                </CardContent>
              </Card>
              {/* Feature Card 3 */}
              <Card>
                <CardHeader>
                  <CardTitle>Free & Open Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Completely free to use with the source code available on
                    GitHub. Contribute or use it as you see fit.
                  </p>
                </CardContent>
              </Card>
              {/* Add more feature cards as needed */}
            </div>
          </div>
        </section>

        {/* Optional: Call to Action Section */}
        <section id="open-source" className="w-full py-12 lg:py-24">
          <div className="container">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Sign up or log in to start managing your timers like a pro.
                Tokei is free forever.
              </p>
              <Button asChild size="lg">
                <Link href="/login">Start Timing Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:px-8 md:py-0">
        <div className="grid w-full grid-cols-1 place-items-center justify-between gap-4 text-center md:h-24 md:flex-row">
          <p className="w-full text-center text-sm leading-loose text-muted-foreground">
            Built by{' '}
            <a
              href="https://github.com/harryt04?tab=repositories"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Harry Thomas
            </a>
            . The source code is available on{' '}
            <a
              href="https://github.com/harryt04/tokei"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}

export { LandingPage }
