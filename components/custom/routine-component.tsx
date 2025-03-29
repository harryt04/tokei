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

  return (
    <Card
      className="min-h-full cursor-pointer"
      onClick={() => router.push(`/routine/${routine._id}`)}
    >
      <CardHeader>
        <CardTitle>{routine.name}</CardTitle>
        <CardDescription>
          {routine.swimLanes?.length || 0} Swimlanes, {totalSteps} Steps
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
