'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof Parts.Checkbox>,
  StyledProps<typeof Parts.Checkbox>
>(({ className, ...props }, ref) => (
  <Parts.Checkbox
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-checked:text-primary-foreground',
      className,
    )}
    {...props}
  >
    <Parts.CheckboxIndicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className="h-4 w-4" />
    </Parts.CheckboxIndicator>
  </Parts.Checkbox>
))
Checkbox.displayName = 'Checkbox'

export { Checkbox }
