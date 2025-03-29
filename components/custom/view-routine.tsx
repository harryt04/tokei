import { Routine } from '@/models'
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'

export type ViewRoutineProps = {
  routine: Routine
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine } = props
  return (
    <div>
      <div className="flex flex-row place-items-center p-4 md:gap-4">
        <Button size="icon" variant="ghost">
          <ArrowLeftIcon />
        </Button>

        <p className="text-md p-8 md:text-3xl">{routine.name}</p>

        <Button size="icon" variant="ghost">
          <PencilIcon />
        </Button>
      </div>
    </div>
  )
}
