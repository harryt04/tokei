'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/progress'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof Parts.Progress>,
  StyledProps<typeof Parts.Progress>
>(({ className, value, ...props }, ref) => (
  <Parts.Progress
    ref={ref}
    value={value}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className,
    )}
    {...props}
  >
    <Parts.ProgressIndicator className="h-full w-(--progress-value) bg-primary transition-all" />
  </Parts.Progress>
))
Progress.displayName = 'Progress'

export { Progress }
