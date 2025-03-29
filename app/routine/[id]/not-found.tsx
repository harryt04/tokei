import { Button } from '@/components/ui/button'
import { Repeat2Icon } from 'lucide-react'
import Link from 'next/link'

export default async function RoutineNotFound() {
  return (
    <div className="grid w-full place-content-center justify-center gap-4">
      <h1>404 Routine not found.</h1>
      <Link href="/routines">
        <Button>
          <Repeat2Icon />
          Back to Routines
        </Button>
      </Link>
    </div>
  )
}
