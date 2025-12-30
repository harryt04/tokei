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
import { SwimlanesList, SwimlanesListHandle } from './swimlanes-list'
import { PrepTasksList, PrepTasksListHandle } from './prep-tasks-list'
import { RoutineNotes } from './routine-notes'
import StartRoutineDialog, { StartMode } from './start-routine-dialog'
import { getDateGivenTimeOfDay, getCompletionTime } from '@/lib/utils'
import RunRoutineComponent from './run-routine-component'
import { toast } from '../ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export type ViewRoutineProps = {
  routine: Routine
}

type RoutineRunningState = {
  status: 'running' | 'paused' | 'stopped' | ''
  endTime?: Date
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine: initialRoutine } = props
  // Local state to track the current routine with any updates
  const [currentRoutine, setCurrentRoutine] = useState<Routine>(initialRoutine)
  const defaultName = `Unnamed Routine`
  const [name, setName] = useState(
    !!currentRoutine.name ? currentRoutine.name : defaultName,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [routineRunningState, setRoutineRunningState] =
    useState<RoutineRunningState>({ status: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('swimlanes')
  const [swimlanesCount, setSwimlanesCount] = useState(
    currentRoutine.swimLanes?.length ?? 0,
  )
  const [prepTasksCount, setPrepTasksCount] = useState(
    currentRoutine.prepTasks?.length ?? 0,
  )
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const swimlanesListRef = useRef<SwimlanesListHandle>(null)
  const prepTasksListRef = useRef<PrepTasksListHandle>(null)
  const router = useRouter()

  // Initialize useRoutines with the current routine
  const { updateRoutine, deleteRoutine } = useRoutines([currentRoutine])

  // Callback when child components update the routine
  const handleRoutineChange = (updatedRoutine: Partial<Routine>) => {
    setCurrentRoutine((prev) => ({ ...prev, ...updatedRoutine }))
  }

  // Handle tab change - save any unsaved changes before switching
  const handleTabChange = async (newTab: string) => {
    // Save current tab's changes before switching
    if (
      activeTab === 'swimlanes' &&
      swimlanesListRef.current?.hasUnsavedChanges()
    ) {
      await swimlanesListRef.current.saveIfDirty()
    } else if (
      activeTab === 'prep' &&
      prepTasksListRef.current?.hasUnsavedChanges()
    ) {
      await prepTasksListRef.current.saveIfDirty()
    }
    setActiveTab(newTab)
  }

  const handleNameChange = (newName: string) => {
    setName(newName)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      if (newName !== currentRoutine.name) {
        updateRoutineName(newName)
      }
    }, 2000)
  }

  const updateRoutineName = async (newName: string) => {
    try {
      setUpdateError(null)
      await updateRoutine(currentRoutine._id!, { name: newName ?? defaultName })
      handleRoutineChange({ name: newName ?? defaultName })
      // Optionally refresh the page data to ensure consistency
      router.refresh()
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update routine name')
      console.error('Error updating routine:', err)
    }
  }

  const handleBlur = () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    if (name !== currentRoutine.name) {
      updateRoutineName(name)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteRoutine(currentRoutine)
      router.push('/routines') // Navigate back to routines list after deletion
    } catch (err: any) {
      console.error('Error deleting routine:', err)
      setUpdateError(err.message || 'Failed to delete routine')
    }
  }

  const handleStartRoutine = (startMode: StartMode, endTime: string) => {
    switch (startMode) {
      case 'now': {
        const completionTime = getCompletionTime(currentRoutine)
        console.log('completionTime: ', completionTime)
        setRoutineRunningState({ status: 'running', endTime: completionTime })
        break
      }
      case 'timed': {
        const endTimeDate = getDateGivenTimeOfDay(endTime)
        setRoutineRunningState({ status: 'running', endTime: endTimeDate })
        break
      }
      default:
        break
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [])
  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden p-2 sm:p-4">
      {/* Mobile: stack vertically, Desktop: horizontal row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Top row: back button + name */}
        <div className="flex w-full items-center gap-2">
          <Link href="/routines">
            <Button size="icon" variant="ghost" className="shrink-0">
              <ArrowLeftIcon />
            </Button>
          </Link>

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
              className="flex-1 text-base sm:text-lg md:text-xl"
            />
          ) : (
            <div
              className="flex h-10 flex-1 cursor-pointer items-center truncate rounded-md border border-transparent bg-background px-2 text-base sm:text-lg md:text-xl"
              onClick={() => setIsEditing(true)}
            >
              {name}
            </div>
          )}
        </div>

        {/* Action buttons - full width on mobile */}
        {routineRunningState.status !== 'running' &&
          routineRunningState.status !== 'paused' && (
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="default"
                onClick={() => setStartDialogOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <PlayIcon className="mr-1 h-4 w-4 sm:mr-2" />
                Start
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2Icon className="mr-1 h-4 w-4 sm:mr-2" />
                Delete
              </Button>
            </div>
          )}
      </div>

      {updateError && (
        <p className="mt-2 text-sm text-red-500">{updateError}</p>
      )}
      <Separator className="mt-3 sm:mt-2" />
      {/* end header */}

      {routineRunningState.status === '' && (
        <div className="px-0 py-2 sm:p-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-3 p-1">
              <TabsTrigger
                value="swimlanes"
                className="flex-col gap-0.5 px-2 py-1.5 text-xs sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
              >
                <span>Swimlanes</span>
                {swimlanesCount > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] sm:text-xs">
                    {swimlanesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="prep"
                className="flex-col gap-0.5 px-2 py-1.5 text-xs sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
              >
                <span>Prep</span>
                {prepTasksCount > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] sm:text-xs">
                    {prepTasksCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swimlanes" className="mt-4">
              <SwimlanesList
                ref={swimlanesListRef}
                routine={currentRoutine}
                onCountChange={setSwimlanesCount}
                onRoutineChange={handleRoutineChange}
              />
            </TabsContent>

            <TabsContent value="prep" className="mt-4">
              <PrepTasksList
                ref={prepTasksListRef}
                routine={currentRoutine}
                onCountChange={setPrepTasksCount}
                onRoutineChange={handleRoutineChange}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <RoutineNotes routine={currentRoutine} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {(routineRunningState.status === 'running' ||
        routineRunningState.status === 'paused') && (
        <div className="p-4">
          <RunRoutineComponent
            routine={currentRoutine}
            initialStatus={routineRunningState.status}
            endTime={routineRunningState.endTime}
            onStatusChange={(newStatus) => {
              if (newStatus === 'stopped') {
                setRoutineRunningState({ status: '' })
                toast({
                  title: 'Routine stopped',
                  description: 'Your routine has been stopped.',
                })
              } else {
                setRoutineRunningState({
                  ...routineRunningState,
                  status: newStatus,
                })
              }
            }}
          />
        </div>
      )}

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
        onClose={(startMode?: StartMode, endTime?: string) => {
          setStartDialogOpen(false)
          if (!startMode || !endTime) return
          handleStartRoutine(startMode, endTime)
        }}
        routine={currentRoutine}
      />
    </div>
  )
}
