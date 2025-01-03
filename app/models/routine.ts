export type RoutineInput = {
  name: string
}

export type Routine = RoutineInput & {
  _id: string
  userId: string
  steps: RoutineStep[]
}

export type RoutineStep = {
  id: string
  name: string
  durationInSeconds: number
  startType: 'cascading' | 'manual' // cascading: start when the previous step ends, manual: start immediately
}
