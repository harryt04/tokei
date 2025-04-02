'use client'
import { Routine } from '@/models'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { ArrowLeftIcon, Trash2Icon, PlayIcon } from 'lucide-react'
import { useRoutines } from '@/hooks/use-routines'
import { useRouter } from 'next/navigation'
import { Separator } from '../ui/separator'
import Link from 'next/link'
import ConfirmationDialog from './confirmation-dialog'
import { Input } from '../ui/input'
import { H4 } from '../ui/typography'
import { SwimlanesList } from './swimlanes-list'
import StartRoutineDialog, { StartMode } from './start-routine-dialog'
import { getDateGivenTimeOfDay } from '@/lib/utils'

export type ViewRoutineProps = {
  routine: Routine
}

type RoutineRunningState = {
  status: 'running' | 'paused' | ''
  endTime?: Date
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine } = props
  const defaultName = `Unnamed Routine`
  const [name, setName] = useState(!!routine.name ? routine.name : defaultName)
  const [isEditing, setIsEditing] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [routineRunningState, setRoutineRunningState] =
    useState<RoutineRunningState>({ status: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Initialize useRoutines with the current routine
  const { updateRoutine, deleteRoutine } = useRoutines([routine])

  const handleNameChange = (newName: string) => {
    setName(newName)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      if (newName !== routine.name) {
        updateRoutineName(newName)
      }
    }, 2000)
  }

  const updateRoutineName = async (newName: string) => {
    try {
      setUpdateError(null)
      await updateRoutine(routine._id!, { name: newName ?? defaultName })
      // Optionally refresh the page data to ensure consistency
      router.refresh()
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update routine name')
      console.error('Error updating routine:', err)
    }
  }

  const handleBlur = () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    if (name !== routine.name) {
      updateRoutineName(name)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteRoutine(routine)
      router.push('/routines') // Navigate back to routines list after deletion
    } catch (err: any) {
      console.error('Error deleting routine:', err)
      setUpdateError(err.message || 'Failed to delete routine')
    }
  }

  const handleStartRoutine = (startMode: StartMode, endTime: string) => {
    switch (startMode) {
      case 'now':
        break
      case 'timed':
        const endTimeDate = getDateGivenTimeOfDay(endTime)
        console.log('Parsed endTimeDate: ', endTimeDate)
        break

      default:
        break
    }

    // Parse endTime (e.g., "21:00") into a Date object for today
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden p-4">
      <div className="flex w-full flex-row place-items-center md:gap-4">
        <Link href="/routines">
          <Button size="icon" variant="ghost">
            <ArrowLeftIcon />
          </Button>
        </Link>

        <div className="flex w-full items-center justify-between">
          {isEditing ? (
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBlur()
              }}
              autoFocus
              className="text-md mx-8 w-full md:text-xl"
            />
          ) : (
            <div
              className="text-md m-0 flex h-10 w-full cursor-pointer items-center rounded-md border border-transparent bg-background px-2 md:mx-8 md:px-3 md:py-2 md:text-xl"
              onClick={() => setIsEditing(true)}
            >
              {name}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setStartDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <PlayIcon className="h-4 w-4" />
              Start
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {updateError && <p className="text-sm text-red-500">{updateError}</p>}
      </div>
      <Separator className="mt-2" />
      {/* end header */}

      <div className="p-4">
        <H4>Swimlanes</H4>
        <Separator className="mt-2" />

        <SwimlanesList routine={routine} />
      </div>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Routine"
        description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
        onConfirmLabel="Delete"
        onCancelLabel="Cancel"
      />

      <StartRoutineDialog
        isOpen={startDialogOpen}
        onClose={(startMode: StartMode, endTime: string) => {
          handleStartRoutine(startMode, endTime)
          setStartDialogOpen(false)
        }}
        routine={routine}
      />
    </div>
  )
}
