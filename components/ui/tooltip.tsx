'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/tooltip'

import { cn } from '@/lib/utils'

const Delay = React.createContext(700)
function TooltipProvider({
  delayDuration = 700,
  children,
}: {
  delayDuration?: number
  children?: React.ReactNode
}) {
  return <Delay.Provider value={delayDuration}>{children}</Delay.Provider>
}

function Tooltip(props: React.ComponentProps<typeof Parts.Tooltip>) {
  return <Parts.Tooltip delay={React.useContext(Delay)} {...props} />
}

function TooltipTrigger({
  asChild,
  children,
  ...props
}: StyledProps<typeof Parts.TooltipTrigger> & { asChild?: boolean }) {
  return asChild && React.isValidElement(children) ? (
    <Parts.TooltipTrigger {...props} render={children} />
  ) : (
    <Parts.TooltipTrigger {...props}>{children}</Parts.TooltipTrigger>
  )
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof Parts.TooltipContent>,
  StyledProps<typeof Parts.TooltipContent>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <Parts.TooltipContent
    container={typeof document === 'undefined' ? null : document.body}
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 origin-(--transform-origin) animate-in overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
))
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
