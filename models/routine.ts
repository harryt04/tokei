export type RoutineInput = {
  name: string
}

export type Routine = RoutineInput & {
  _id: string
  userId: string
  swimLanes?: RoutineSwimLane[]
  syncConfig?: SwimLaneSyncConfig // Configuration for swimlane synchronization
}

export type RoutineStep = {
  id: string
  swimLaneId: string
  name: string
  sequence: number
  durationInSeconds: number

  // automatic: start immediately when the previous step ends
  // manual: wait for user to click a button to begin step
  startType: 'automatic' | 'manual'
}

export type RoutineSwimLane = {
  id: string
  name: string
  steps: RoutineStep[]
}

export type SwimLaneSyncConfig = {
  syncAll: boolean // If true, all swimlanes must synchronize their completion
  syncGroups?: SyncGroup[] // Optional groups of swimlanes to synchronize
}

export type SyncGroup = {
  id: string
  name?: string
  swimLaneIds: string[] // IDs of swimlanes in this group
}

export const getRoutineTotalSteps = (routine: Routine): number => {
  return (
    routine.swimLanes?.reduce(
      (total, swimLane) => total + swimLane.steps.length,
      0,
    ) || 0
  )
}
