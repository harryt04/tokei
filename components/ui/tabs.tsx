'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/tabs'

import { cn } from '@/lib/utils'

function Tabs({
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Parts.Tabs>, 'onValueChange'> & {
  onValueChange?: (value: string) => void
}) {
  return (
    <Parts.Tabs
      {...props}
      onValueChange={(value) => {
        if (value !== null) onValueChange?.(value)
      }}
    />
  )
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof Parts.TabsList>,
  StyledProps<typeof Parts.TabsList>
>(({ className, ...props }, ref) => (
  <Parts.TabsList
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Parts.TabsTab>,
  StyledProps<typeof Parts.TabsTab>
>(({ className, ...props }, ref) => (
  <Parts.TabsTab
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  React.ElementRef<typeof Parts.TabsPanel>,
  StyledProps<typeof Parts.TabsPanel>
>(({ className, ...props }, ref) => (
  <Parts.TabsPanel
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
