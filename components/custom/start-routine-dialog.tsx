'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Clock, PlayCircle } from 'lucide-react'
import { Routine } from '@/models'
import { format } from 'date-fns'
import { getRoutineDurationInSeconds, formatSecondsToHHMMSS } from '@/lib/utils'

export type StartRoutineDialogProps = {
  isOpen: boolean
  onClose: (startMode?: StartMode, endTime?: string) => void
  routine: Routine
}

export type StartMode = 'now' | 'timed'

export default function StartRoutineDialog({
  isOpen,
  onClose,
  routine,
}: StartRoutineDialogProps) {
  const [startMode, setStartMode] = useState<StartMode>('now')
  const [endTime, setEndTime] = useState<string>(
    format(new Date(Date.now() + 60 * 60 * 1000), 'HH:mm'), // Default to 1 hour from now
  )
  const [error, setError] = useState<string | null>(null)

  // Calculate minimum required duration for this routine
  const routineDurationInSeconds = useMemo(
    () => getRoutineDurationInSeconds(routine),
    [routine],
  )

  const handleStartRoutine = () => {
    if (startMode === 'timed') {
      // Parse the selected end time
      const now = new Date()
      const [hours, minutes] = endTime.split(':').map(Number)
      const selectedEndTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0,
      )

      // If the selected time is earlier than now, assume it's tomorrow
      if (selectedEndTime <= now) {
        selectedEndTime.setDate(selectedEndTime.getDate() + 1)
      }

      // Calculate time available from now until the selected end time
      const timeAvailableInSeconds =
        (selectedEndTime.getTime() - now.getTime()) / 1000

      // Check if we have enough time
      if (timeAvailableInSeconds < routineDurationInSeconds) {
        const minDuration = formatSecondsToHHMMSS(routineDurationInSeconds)
        setError(
          `This routine requires at least ${minDuration}. Please select a later end time.`,
        )
        return
      }
    }

    setError(null)
    onClose(startMode, endTime)
  }

  // Calculate the earliest possible completion time for display
  const earliestCompletionTime = useMemo(() => {
    const now = new Date()
    return new Date(now.getTime() + routineDurationInSeconds * 1000)
  }, [routineDurationInSeconds])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Routine: {routine.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={startMode}
            onValueChange={(value) => setStartMode(value as StartMode)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="now" id="now" />
              <Label
                htmlFor="now"
                className="flex cursor-pointer items-center gap-2"
              >
                <PlayCircle size={18} />
                Start immediately
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="timed" id="timed" />
              <Label
                htmlFor="timed"
                className="flex cursor-pointer items-center gap-2"
              >
                <Clock size={18} />
                End at specific time
              </Label>

              <div className="ml-2">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onFocus={() => setStartMode('timed')}
                  className="w-32"
                />
              </div>
            </div>
          </RadioGroup>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleStartRoutine}>
            {startMode === 'now' ? 'View' : 'Start'} Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
