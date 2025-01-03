export type RoutineInput = {
  name: string
}

export type Routine = RoutineInput & {
  _id: string
  userId: string
  steps?: RoutineStep[]
  swimLanes?: RoutineSwimLane[]
}

export type RoutineStep = {
  id: string
  swimLaneId: string
  name: string
  sequence: number
  durationInSeconds: number
  startType: 'cascading' | 'manual' // cascading: start when the previous step ends, manual: start immediately
}

export type RoutineSwimLane = {
  id: string
  name: string
}
