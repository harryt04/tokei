import { Routine } from '@/models'
import React from 'react'
import { P } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import { GlassWaterIcon } from 'lucide-react'

export type SwimlanesListProps = {
  routine: Routine
}
export function SwimlanesList(props: SwimlanesListProps) {
  const { swimLanes } = props.routine
  if (!swimLanes || swimLanes.length === 0)
    return (
      <NoResultsComponent
        icon={<GlassWaterIcon />}
        title={'No swimlanes created yet'}
        body={[
          'A swimlane is any collection of timers that need to run sequentially.',
          'Swimlanes run in parallel, and can be configured to complete at the same time.',
          'Click Add Swimlane to get started',
        ]}
        className="mt-4"
      />
    )

  return (
    <>
      {props.routine.swimLanes?.map((swimLane) => {
        return (
          <>
            <P>{swimLane.name}</P>
          </>
        )
      })}
    </>
  )
}
