'use client'
import { Routine, RoutineSwimLane } from '@/models'
import React, { useState } from 'react'
import { P } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import { PlusIcon, WavesIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'

export type SwimlanesListProps = {
  routine: Routine
}
export function SwimlanesList(props: SwimlanesListProps) {
  const [swimLanes, setSwimLanes] = useState<RoutineSwimLane[]>(
    props.routine.swimLanes ?? [],
  )

  const AddSwimlaneButton = () => (
    <Button
      variant="outline"
      onClick={() => {
        setSwimLanes((existingSwimLanes) => [
          ...existingSwimLanes,
          {
            id: uuidv4(),
            name: `Swimlane ${existingSwimLanes.length + 1}`,
            steps: [],
          },
        ])
      }}
      className="mt-4"
    >
      <PlusIcon />
      Add swimlane
    </Button>
  )
  if (!swimLanes || swimLanes.length === 0)
    return (
      <>
        <NoResultsComponent
          icon={<WavesIcon />}
          title={'No swimlanes created yet'}
          body={[
            'A swimlane is any collection of timers that need to run sequentially.',
            'Swimlanes run in parallel, and can be configured to complete at the same time.',
            'Click Add Swimlane to get started',
          ]}
          className="mt-4"
        />
        <AddSwimlaneButton />
      </>
    )

  return (
    <>
      {swimLanes?.map((swimLane) => {
        return (
          <div key={swimLane.id}>
            <P>{swimLane.name}</P>
          </div>
        )
      })}
      <AddSwimlaneButton />
    </>
  )
}
