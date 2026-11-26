'use client'
import type { StyledProps } from './part-props'

import { Portal } from './portal'
import * as React from 'react'
import * as Parts from '@ui-sdk/react/menu'
import { Check, ChevronRight, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

const DropdownMenu = Parts.Menu

function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: StyledProps<typeof Parts.MenuTrigger> & { asChild?: boolean }) {
  return asChild && React.isValidElement(children) ? (
    <Parts.MenuTrigger {...props} render={children} />
  ) : (
    <Parts.MenuTrigger {...props}>{children}</Parts.MenuTrigger>
  )
}

const DropdownMenuGroup = Parts.MenuGroup

const DropdownMenuPortal = Portal

const DropdownMenuSub = Parts.MenuSub

const DropdownMenuRadioGroup = Parts.MenuRadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Parts.MenuSubTrigger>,
  StyledProps<typeof Parts.MenuSubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <Parts.MenuSubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent data-open:bg-accent',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </Parts.MenuSubTrigger>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Parts.MenuSubContent>,
  StyledProps<typeof Parts.MenuSubContent>
>(({ className, ...props }, ref) => (
  <Parts.MenuSubContent
    ref={ref}
    className={cn(
      'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Parts.MenuContent>,
  StyledProps<typeof Parts.MenuContent>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <Portal>
    <Parts.MenuContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Parts.MenuItem>,
  StyledProps<typeof Parts.MenuItem> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <Parts.MenuItem
    ref={ref}
    className={cn(
      'relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Parts.MenuCheckboxItem>,
  StyledProps<typeof Parts.MenuCheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <Parts.MenuCheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Parts.MenuItemIndicator>
        <Check className="h-4 w-4" />
      </Parts.MenuItemIndicator>
    </span>
    {children}
  </Parts.MenuCheckboxItem>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Parts.MenuRadioItem>,
  StyledProps<typeof Parts.MenuRadioItem>
>(({ className, children, ...props }, ref) => (
  <Parts.MenuRadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Parts.MenuItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </Parts.MenuItemIndicator>
    </span>
    {children}
  </Parts.MenuRadioItem>
))
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Parts.MenuGroupLabel>,
  StyledProps<typeof Parts.MenuGroupLabel> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <Parts.MenuGroupLabel
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Parts.MenuSeparator>,
  StyledProps<typeof Parts.MenuSeparator>
>(({ className, ...props }, ref) => (
  <Parts.MenuSeparator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
