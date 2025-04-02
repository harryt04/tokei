'use client'

import React, { useState } from 'react'
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
import { Clock, PlayCircle, Eye } from 'lucide-react'
import { Routine } from '@/models'
import { format } from 'date-fns'

export type StartRoutineDialogProps = {
  isOpen: boolean
  onClose: (startMode: StartMode, endTime: string) => void
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

  const handleStartRoutine = () => {
    onClose(startMode, endTime)
  }

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
                  disabled={startMode !== 'timed'}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStartRoutine}>
            {startMode === 'view' ? 'View' : 'Start'} Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
