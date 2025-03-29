'use client'
import { Routine, RoutineSwimLane } from '@/models'
import React, { useState } from 'react'
import { H4 } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import { PlusIcon, WavesIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'
import { Input } from '../ui/input'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'

export type SwimlanesListProps = {
  routine: Routine
}
export function SwimlanesList(props: SwimlanesListProps) {
  const [swimLanes, setSwimLanes] = useState<RoutineSwimLane[]>(
    props.routine.swimLanes ?? [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const handleEdit = (swimLane: RoutineSwimLane) => {
    setEditingId(swimLane.id)
    setEditValue(swimLane.name)
  }

  const handleSave = (id: string) => {
    setSwimLanes((prevLanes) =>
      prevLanes.map((lane) =>
        lane.id === id ? { ...lane, name: editValue } : lane,
      ),
    )
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSave(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

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
          <div key={swimLane.id} className="mb-4">
            {editingId === swimLane.id ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave(swimLane.id)}
                onKeyDown={(e) => handleKeyDown(e, swimLane.id)}
                autoFocus
                className="font-semibold"
              />
            ) : (
              <H4
                onClick={() => handleEdit(swimLane)}
                className="cursor-pointer transition-colors hover:text-primary"
              >
                {swimLane.name}
              </H4>
            )}

            <ScrollArea className="mt-2 h-36 w-full rounded-md border border-dashed border-muted-foreground">
              <div className="flex w-full gap-4 p-4">
                {/* Placeholder items that will be replaced with actual timers */}
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )
      })}
      <AddSwimlaneButton />
    </>
  )
}
