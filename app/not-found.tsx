import { Button } from '@/components/ui/button'
import { HomeIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

export default async function NotFound() {
  return (
    <div className="grid w-full place-content-center justify-center gap-4">
      <h1>404 Page not found.</h1>
      <Link href="/">
        <Button className="ml-4">
          <HomeIcon />
          Go home
        </Button>
      </Link>
    </div>
  )
}
