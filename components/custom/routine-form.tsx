'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Routine, RoutineInput } from '@/models'
import { BanIcon, SaveIcon } from 'lucide-react'

export function RoutineForm({
  onClose,
  onSubmit,
  routine,
}: {
  onClose: () => void
  onSubmit: (routine: Routine) => void
  routine?: Routine // Optional, for editing an existing routine
}) {
  const [formState, setFormState] = useState<RoutineInput>({
    name: routine?.name || '',
  })

  useEffect(() => {
    if (routine) {
      setFormState({
        name: routine.name,
      })
    }
  }, [routine])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      name: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault() // Prevent default browser form submission
    onSubmit({
      ...routine,
      ...formState,
    } as Routine)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="mx-auto max-w-xs rounded-lg p-6 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {routine ? 'Edit Routine' : 'Add Routine'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Enter routine name"
              className="mt-4 w-full"
            />
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-4">
            <Button type="button" onClick={onClose} variant="outline">
              <BanIcon />
              Cancel
            </Button>
            <Button type="submit">
              <SaveIcon />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
