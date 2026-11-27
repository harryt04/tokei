'use client'
import React, { useState, useEffect } from 'react'
import { applySortableOrder, SortableItem, SortableList } from '../ui/sortable'
import FreestyleComponent from './freestyle-component'
import { ClockIcon, PlusIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'
import { NoResultsComponent } from './no-results-component'

export type Timer = {
  id: string
  duration: number
  name: string
  startedAt?: Date
  willEndAt?: Date
}

function FreestyleList() {
  const [timers, setTimers] = useState<Timer[]>([])

  // Load timers from localStorage on component mount
  useEffect(() => {
    const localstorageitems = localStorage.getItem('freestyleTimers')
    const storedTimers = JSON.parse(localstorageitems ?? '[]')

    if (storedTimers?.length > 0) {
      setTimers(storedTimers)
    } else {
      setTimers([
        {
          id: uuidv4(),
          name: 'Timer 1',
          duration: 0,
        },
      ])
    }
  }, [])

  const backupTimers = (timersToStore: Timer[]) => {
    localStorage.removeItem('freestyleTimers')
    let storedTimers = JSON.parse(
      localStorage.getItem('freestyleTimers') as string,
    )
    localStorage.setItem('freestyleTimers', JSON.stringify(timersToStore))
    storedTimers = JSON.parse(localStorage.getItem('freestyleTimers') as string)
  }

  // Update localStorage whenever timers change
  useEffect(() => {
    if (timers.length === 0) return
    backupTimers(timers)
  }, [timers])

  const timersById = new Map(timers.map((timer) => [timer.id, timer]))

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <SortableList
        aria-label="Timers"
        className="flex flex-col gap-4"
        value={Array.from(timersById.keys())}
        label={(id) => timersById.get(id)?.name.trim() || 'timer'}
        onValueChange={(order) =>
          setTimers((current) => applySortableOrder(current, order))
        }
      >
        {(id) => {
          const timer = timersById.get(id)
          if (!timer) return null

          return (
            <SortableItem value={id}>
              <FreestyleComponent
                timer={timer}
                timerUpdated={(updatedTimer) => {
                  setTimers((current) =>
                    current.map((item) =>
                      item.id === id ? updatedTimer : item,
                    ),
                  )
                }}
                removeTimer={(id) => {
                  setTimers((current) => {
                    const remaining = current.filter((timer) => timer.id !== id)
                    if (remaining.length === 0) backupTimers([])
                    return remaining
                  })
                }}
              />
            </SortableItem>
          )
        }}
      </SortableList>

      {timers.length === 0 && (
        <>
          <NoResultsComponent
            icon={<ClockIcon />}
            title="No timers"
            body={[
              'Click the button below to get started.',
              'Create as many timers as you need.',
            ]}
          />
        </>
      )}

      <Button
        variant="outline"
        onClick={() => {
          setTimers((previousTimers) => [
            ...previousTimers,
            {
              id: uuidv4(),
              name: `Timer ${previousTimers.length + 1}`,
              duration: 0,
            },
          ])
        }}
      >
        <PlusIcon />
        Add timer
      </Button>
    </div>
  )
}

export default FreestyleList
