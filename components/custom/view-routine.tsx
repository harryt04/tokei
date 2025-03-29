'use client'
import { Routine } from '@/models'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'
import { useRoutines } from '@/hooks/use-routines'
import { useRouter } from 'next/navigation'
import { Separator } from '../ui/separator'
import Link from 'next/link'
import ConfirmationDialog from './confirmation-dialog'
import { Input } from '../ui/input'

export type ViewRoutineProps = {
  routine: Routine
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine } = props
  const defaultName = `Unnamed Routine`
  const [name, setName] = useState(!!routine.name ? routine.name : defaultName)
  const [isEditing, setIsEditing] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])

  return (
    <div className="w-full p-4">
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
              className="text-md mx-8 flex h-10 w-full cursor-pointer items-center rounded-md border border-transparent bg-background px-3 py-2 md:text-xl"
              onClick={() => setIsEditing(true)}
            >
              {name}
            </div>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="h-5 w-5" />
          </Button>
        </div>

        {updateError && <p className="text-sm text-red-500">{updateError}</p>}
      </div>
      <Separator className="mt-2" />
      {/* end header */}

      <div>
        <p>Swimlanes</p>
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
    </div>
  )
}
