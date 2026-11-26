'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/scroll-area'

import { cn } from '@/lib/utils'

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof Parts.ScrollArea>,
  StyledProps<typeof Parts.ScrollArea>
>(({ className, children, ...props }, ref) => (
  <Parts.ScrollArea
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <Parts.ScrollAreaViewport className="h-full w-full [scrollbar-width:none] overflow-auto rounded-[inherit]">
      <Parts.ScrollAreaContent>{children}</Parts.ScrollAreaContent>
    </Parts.ScrollAreaViewport>
    <ScrollBar />
    <Parts.ScrollAreaCorner />
  </Parts.ScrollArea>
))
ScrollArea.displayName = 'ScrollArea'

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof Parts.ScrollAreaScrollbar>,
  StyledProps<typeof Parts.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <Parts.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'absolute flex touch-none opacity-0 transition-opacity select-none data-visible:opacity-100',
      orientation === 'vertical' &&
        'inset-y-0 right-0 w-2.5 border-l border-l-transparent p-px',
      orientation === 'horizontal' &&
        'inset-x-0 bottom-0 h-2.5 flex-col border-t border-t-transparent p-px',
      className,
    )}
    {...props}
  >
    <Parts.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </Parts.ScrollAreaScrollbar>
))
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
