'use client'
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { PlayIcon } from 'lucide-react'
import { Timer } from './freestyle-list'
import { getDateNMinutesFromNow } from '@/lib/utils'

export type FreestyleComponentProps = {
  timer: Timer
  timerUpdated: (newTimer: Timer) => void
}

function FreestyleComponent(props: FreestyleComponentProps) {
  const [title, setTitle] = useState(props.timer?.name ?? 'Timer 1')
  const [duration, setDuration] = useState(props.timer?.duration.toString()) // Track duration input

  const handleStart = () => {
    const now = new Date()
    props.timerUpdated({
      ...props.timer,
      startedAt: now,
      willEndAt: getDateNMinutesFromNow(Number(duration)),
    })
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                props.timerUpdated({ ...props.timer, name: e.target.value })
              }}
              className="w-full border-none bg-transparent outline-none"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            placeholder="0"
            type="number"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value)
              props.timerUpdated({
                ...props.timer,
                duration: Number(e.target.value),
              })
            }}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart}>
            <PlayIcon />
            Start
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default FreestyleComponent
