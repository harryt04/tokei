'use client'
import React, { useState, useEffect } from 'react'
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

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      {timers.map((timer, index) => (
        <FreestyleComponent
          key={timer.id}
          timer={timer}
          timerUpdated={(newTimer) => {
            setTimers((prevTimers) => {
              const updatedTimers = [...prevTimers]
              updatedTimers[index] = { ...newTimer }
              return updatedTimers
            })
          }}
          removeTimer={(id) => {
            setTimers((prevTimers) => {
              const newTimerList = prevTimers.filter((t) => t.id !== id)
              if (newTimerList.length === 0) backupTimers([])
              return newTimerList
            })
          }}
        />
      ))}

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
        variant="secondary"
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
