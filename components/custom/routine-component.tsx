import { Routine, getRoutineTotalSteps } from '@/models'
import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { useRouter } from 'next/navigation'

export const RoutineComponent = ({ routine }: { routine: Routine }) => {
  const router = useRouter()
  const totalSteps = getRoutineTotalSteps(routine)
  const swimlaneCount = routine.swimLanes?.length || 0
  const prepTaskCount = routine.prepTasks?.length || 0

  return (
    <Card
      className="min-h-full cursor-pointer"
      onClick={() => router.push(`/routine/${routine._id}`)}
    >
      <CardHeader>
        <CardTitle>{routine.name}</CardTitle>
        <CardDescription>
          {swimlaneCount} {swimlaneCount === 1 ? 'Swimlane' : 'Swimlanes'},{' '}
          {totalSteps} {totalSteps === 1 ? 'Step' : 'Steps'}, {prepTaskCount}{' '}
          {prepTaskCount === 1 ? 'Prep Task' : 'Prep Tasks'}
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
