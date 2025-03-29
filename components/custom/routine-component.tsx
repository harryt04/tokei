import { Routine } from '@/models'
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

  return (
    <Card
      className="min-h-full cursor-pointer"
      onClick={() => router.push(`/routine/${routine._id}`)}
    >
      <CardHeader>
        <CardTitle>{routine.name}</CardTitle>
        <CardDescription>
          {routine.steps?.length || 0} Steps, {routine.swimLanes?.length || 0}{' '}
          Swimlanes
        </CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
