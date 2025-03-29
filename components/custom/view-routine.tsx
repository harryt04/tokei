'use client'
import { Routine } from '@/models'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import { useRoutines } from '@/hooks/use-routines'
import { useRouter } from 'next/navigation'

export type ViewRoutineProps = {
  routine: Routine
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine } = props
  const [name, setName] = useState(
    !!routine.name ? routine.name : `Routine ${routine._id}`,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Initialize useRoutines with the current routine
  const { updateRoutine } = useRoutines([routine])

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
      await updateRoutine(routine._id!, { name: newName })
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])

  return (
    <div className="w-full p-4">
      <div className="flex w-full flex-row place-items-center md:gap-4">
        <Button size="icon" variant="ghost">
          <ArrowLeftIcon />
        </Button>

        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlur()
            }}
            autoFocus
            className="text-md w-full p-8 md:text-3xl"
          />
        ) : (
          <p
            className="text-md w-full p-8 md:text-3xl"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </p>
        )}

        {updateError && <p className="text-sm text-red-500">{updateError}</p>}
      </div>
    </div>
  )
}
