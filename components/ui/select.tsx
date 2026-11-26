'use client'
import type { StyledProps } from './part-props'

import { Portal } from './portal'
import * as React from 'react'
import * as Parts from '@ui-sdk/react/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select<T extends string>({
  onValueChange,
  ...props
}: Omit<
  Extract<Parts.SelectProps<T, false>, { multiple?: false }>,
  'onValueChange'
> & { onValueChange?: (value: T) => void }) {
  return (
    <Parts.Select<T, false>
      {...props}
      onValueChange={(value) => {
        if (value !== null) onValueChange?.(value)
      }}
    />
  )
}

const SelectGroup = Parts.SelectGroup

const SelectValue = Parts.SelectValue

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Parts.SelectTrigger>,
  StyledProps<typeof Parts.SelectTrigger>
>(({ className, children, ...props }, ref) => (
  <Parts.SelectTrigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <span aria-hidden>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </span>
  </Parts.SelectTrigger>
))
SelectTrigger.displayName = 'SelectTrigger'

function scrollOption(
  event: React.MouseEvent<HTMLButtonElement>,
  direction: number,
) {
  event.currentTarget.parentElement
    ?.querySelector('[role="listbox"]')
    ?.scrollBy({ top: direction * 40 })
}
function SelectScrollUpButton(props: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label="Scroll up"
      onClick={(event) => scrollOption(event, -1)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </button>
  )
}
function SelectScrollDownButton(props: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label="Scroll down"
      onClick={(event) => scrollOption(event, 1)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </button>
  )
}
const SelectContent = React.forwardRef<
  React.ElementRef<typeof Parts.SelectContent>,
  StyledProps<typeof Parts.SelectContent> & {
    position?: 'popper' | 'item-aligned'
  }
>(({ className, children, position = 'popper', ...props }, ref) => (
  <Portal>
    <Parts.SelectContent
      ref={ref}
      className={cn(
        'relative z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      container={typeof document === 'undefined' ? null : document.body}
      {...props}
    >
      <Parts.SelectList
        className={cn(
          'p-1',
          position === 'popper' &&
            'max-h-(--available-height) w-full min-w-(--anchor-width) overflow-y-auto',
        )}
      >
        {children}
      </Parts.SelectList>
    </Parts.SelectContent>
  </Portal>
))
SelectContent.displayName = 'SelectContent'

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof Parts.SelectGroupLabel>,
  StyledProps<typeof Parts.SelectGroupLabel>
>(({ className, ...props }, ref) => (
  <Parts.SelectGroupLabel
    ref={ref}
    className={cn('py-1.5 pr-2 pl-8 text-sm font-semibold', className)}
    {...props}
  />
))
SelectLabel.displayName = 'SelectLabel'

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Parts.SelectItem>,
  StyledProps<typeof Parts.SelectItem>
>(({ className, children, ...props }, ref) => (
  <Parts.SelectItem
    label={typeof children === 'string' ? children : undefined}
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Parts.SelectItemIndicator>
        <Check className="h-4 w-4" />
      </Parts.SelectItemIndicator>
    </span>

    {children}
  </Parts.SelectItem>
))
SelectItem.displayName = 'SelectItem'

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof Parts.SelectSeparator>,
  StyledProps<typeof Parts.SelectSeparator>
>(({ className, ...props }, ref) => (
  <Parts.SelectSeparator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
