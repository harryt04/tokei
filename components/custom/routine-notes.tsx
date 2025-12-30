'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Routine } from '@/models'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { SaveIcon, CheckIcon } from 'lucide-react'
import { useRoutines } from '@/hooks/use-routines'
import { toast } from '../ui/use-toast'
import { Muted } from '../ui/typography'

export type RoutineNotesProps = {
  routine: Routine
  readOnly?: boolean
}

export function RoutineNotes({ routine, readOnly = false }: RoutineNotesProps) {
  const [notes, setNotes] = useState(routine.notes ?? '')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const { updateRoutine } = useRoutines([routine])

  // Track changes
  useEffect(() => {
    setHasChanges(notes !== (routine.notes ?? ''))
  }, [notes, routine.notes])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])

  const handleSave = async () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    setIsSaving(true)
    try {
      await updateRoutine(routine._id, { notes })
      toast({
        title: 'Success',
        description: 'Notes saved successfully',
      })
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (value: string) => {
    setNotes(value)
    // Auto-save after 2 seconds of inactivity
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      if (value !== (routine.notes ?? '')) {
        handleSave()
      }
    }, 2000)
  }

  if (readOnly) {
    return (
      <div className="rounded-md border bg-muted/50 p-4">
        {notes ? (
          <p className="whitespace-pre-wrap text-sm">{notes}</p>
        ) : (
          <Muted>No notes for this routine.</Muted>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add notes for this routine... e.g., ingredient lists, special instructions, tips, etc."
        className="min-h-24 resize-y"
      />
      <div className="flex items-center justify-between">
        <Muted className="text-xs">Auto-saves after 2 seconds</Muted>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="sm"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : saveSuccess ? (
            <>
              <CheckIcon className="mr-1 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <SaveIcon className="mr-1 h-4 w-4" />
              Save Now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
