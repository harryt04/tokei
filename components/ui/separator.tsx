'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/separator'

import { cn } from '@/lib/utils'

const Separator = React.forwardRef<
  React.ElementRef<typeof Parts.Separator>,
  StyledProps<typeof Parts.Separator>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref,
  ) => (
    <Parts.Separator
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
)
Separator.displayName = 'Separator'

export { Separator }
