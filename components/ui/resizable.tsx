'use client'

import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/resizable'
import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

type ResizablePanelGroupProps = Omit<
  StyledProps<typeof Parts.Resizable>,
  'orientation'
> & {
  /** shadcn name for UI SDK's `orientation`. */
  direction?: 'horizontal' | 'vertical'
  orientation?: 'horizontal' | 'vertical'
}

const ResizablePanelGroup = ({
  className,
  direction,
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <Parts.Resizable
    orientation={orientation ?? direction ?? 'horizontal'}
    className={cn(
      'flex h-full w-full data-[orientation=vertical]:flex-col',
      className,
    )}
    {...props}
  />
)

const ResizablePanel = Parts.ResizablePanel

const ResizableHandle = ({
  withHandle,
  className,
  children,
  ...props
}: StyledProps<typeof Parts.ResizableHandle> & {
  withHandle?: boolean
}) => (
  <Parts.ResizableHandle
    className={cn(
      'relative flex w-px items-center justify-center bg-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full [&[data-orientation=vertical]>div]:rotate-90',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical aria-hidden="true" className="h-2.5 w-2.5" />
      </div>
    )}
    {children}
  </Parts.ResizableHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
