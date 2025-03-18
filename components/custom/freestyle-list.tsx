'use client'
import React, { useState, useEffect } from 'react'
import FreestyleComponent from './freestyle-component'

export type Timer = {
  duration: number
  name: string
  startedAt?: Date
  completionTime?: Date
}

function FreestyleList() {
  const [timers, setTimers] = useState<Timer[]>([])

  // Load timers from localStorage on component mount
  useEffect(() => {
    const storedTimers = JSON.parse(
      localStorage.getItem('freestyleTimers') as string,
    )
    if (!storedTimers || storedTimers?.length === 0) {
      setTimers([
        {
          name: 'Timer 1',
          duration: 0,
        },
      ])
    } else {
      setTimers(storedTimers)
    }
  }, [])

  // Update localStorage whenever timers change
  useEffect(() => {
    localStorage.setItem('freestyleTimers', JSON.stringify(timers))
  }, [timers])

  return (
    <div>
      {timers.map((timer, index) => (
        <FreestyleComponent
          key={index}
          timer={timer}
          nameUpdated={(newName) => {
            // update timer at index with newname
            timer.name = newName
          }}
        />
      ))}
    </div>
  )
}

export default FreestyleList
