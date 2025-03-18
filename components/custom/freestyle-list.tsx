'use client'
import React, { useState, useEffect } from 'react'
import FreestyleComponent from './freestyle-component'

export type Timer = {
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
          name: 'Timer 1',
          duration: 0,
        },
      ])
    }
  }, [])

  // Update localStorage whenever timers change
  useEffect(() => {
    if (timers.length === 0) return
    localStorage.removeItem('freestyleTimers')
    let storedTimers = JSON.parse(
      localStorage.getItem('freestyleTimers') as string,
    )
    localStorage.setItem('freestyleTimers', JSON.stringify(timers))
    storedTimers = JSON.parse(localStorage.getItem('freestyleTimers') as string)
  }, [timers])

  return (
    <div>
      {timers.map((timer, index) => (
        <FreestyleComponent
          key={index}
          timer={timer}
          timerUpdated={(newTimer) => {
            setTimers((prevTimers) => {
              const updatedTimers = [...prevTimers]
              updatedTimers[index] = { ...newTimer }
              return updatedTimers
            })
          }}
        />
      ))}
    </div>
  )
}

export default FreestyleList
