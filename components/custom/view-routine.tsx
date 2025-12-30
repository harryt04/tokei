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
  const { routine } = props
  const defaultName = `Unnamed Routine`
  const [name, setName] = useState(!!routine.name ? routine.name : defaultName)
  const [isEditing, setIsEditing] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [routineRunningState, setRoutineRunningState] =
    useState<RoutineRunningState>({ status: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('swimlanes')
  const [swimlanesCount, setSwimlanesCount] = useState(
    routine.swimLanes?.length ?? 0,
  )
  const [prepTasksCount, setPrepTasksCount] = useState(
    routine.prepTasks?.length ?? 0,
  )
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const swimlanesListRef = useRef<SwimlanesListHandle>(null)
  const prepTasksListRef = useRef<PrepTasksListHandle>(null)
  const router = useRouter()

  // Initialize useRoutines with the current routine
  const { updateRoutine, deleteRoutine } = useRoutines([routine])

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
      case 'now': {
        const completionTime = getCompletionTime(routine)
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
              className="text-md m-0 flex h-10 w-full cursor-pointer items-center rounded-md border border-transparent bg-background px-2 lg:mx-8 lg:px-3 lg:py-2 lg:text-xl"
              onClick={() => setIsEditing(true)}
            >
              {name}
            </div>
          )}

          {routineRunningState.status !== 'running' &&
            routineRunningState.status !== 'paused' && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={() => setStartDialogOpen(true)}
                >
                  <PlayIcon />
                  Start
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2Icon />
                  Delete
                </Button>
              </div>
            )}
        </div>

        {updateError && <p className="text-sm text-red-500">{updateError}</p>}
      </div>
      <Separator className="mt-2" />
      {/* end header */}

      {routineRunningState.status === '' && (
        <div className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="swimlanes">
                Swimlanes
                {swimlanesCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {swimlanesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="prep">
                Prep Tasks
                {prepTasksCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {prepTasksCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="swimlanes" className="mt-4">
              <SwimlanesList
                ref={swimlanesListRef}
                routine={routine}
                onCountChange={setSwimlanesCount}
              />
            </TabsContent>

            <TabsContent value="prep" className="mt-4">
              <PrepTasksList
                ref={prepTasksListRef}
                routine={routine}
                onCountChange={setPrepTasksCount}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <RoutineNotes routine={routine} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {(routineRunningState.status === 'running' ||
        routineRunningState.status === 'paused') && (
        <div className="p-4">
          <RunRoutineComponent
            routine={routine}
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
        routine={routine}
      />
    </div>
  )
}
