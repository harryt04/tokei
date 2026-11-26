'use client'
import type { StyledProps } from './part-props'

import { Portal } from './portal'
import * as React from 'react'
import * as Parts from '@ui-sdk/react/dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Dialog = Parts.Dialog

function DialogTrigger({
  asChild,
  children,
  ...props
}: StyledProps<typeof Parts.DialogTrigger> & { asChild?: boolean }) {
  return asChild && React.isValidElement(children) ? (
    <Parts.DialogTrigger {...props} render={children} />
  ) : (
    <Parts.DialogTrigger {...props}>{children}</Parts.DialogTrigger>
  )
}

const DialogPortal = Portal

const DialogClose = Parts.DialogClose

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof Parts.DialogBackdrop>,
  StyledProps<typeof Parts.DialogBackdrop>
>(({ className, ...props }, ref) => (
  <Parts.DialogBackdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = React.forwardRef<
  React.ElementRef<typeof Parts.DialogContent>,
  StyledProps<typeof Parts.DialogContent>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <Parts.DialogContent
      container={typeof document === 'undefined' ? null : document.body}
      ref={ref}
      className={cn(
        'fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-left-1/2 data-closed:slide-out-to-top-[48%] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-left-1/2 data-open:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      <Parts.DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-open:bg-accent data-open:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Parts.DialogClose>
    </Parts.DialogContent>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof Parts.DialogTitle>,
  StyledProps<typeof Parts.DialogTitle>
>(({ className, ...props }, ref) => (
  <Parts.DialogTitle
    ref={ref}
    className={cn(
      'text-lg leading-none font-semibold tracking-tight',
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof Parts.DialogDescription>,
  StyledProps<typeof Parts.DialogDescription>
>(({ className, ...props }, ref) => (
  <Parts.DialogDescription
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
