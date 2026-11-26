'use client'
import type { StyledProps } from './part-props'

import { Portal } from './portal'
import * as React from 'react'
import * as Parts from '@ui-sdk/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Sheet = Parts.Dialog

function SheetTrigger({
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

const SheetClose = Parts.DialogClose

const SheetPortal = Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Parts.DialogBackdrop>,
  StyledProps<typeof Parts.DialogBackdrop>
>(({ className, ...props }, ref) => (
  <Parts.DialogBackdrop
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = 'SheetOverlay'

const sheetVariants = cva(
  'fixed z-50 m-0 max-h-dvh gap-4 bg-background p-6 shadow-lg transition ease-in-out data-open:animate-in data-closed:animate-out data-closed:duration-300 data-open:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 bottom-auto border-b data-closed:slide-out-to-top data-open:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 top-auto border-t data-closed:slide-out-to-bottom data-open:slide-in-from-bottom',
        left: 'inset-y-0 left-0 right-auto h-dvh w-3/4 border-r data-closed:slide-out-to-left data-open:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 left-auto h-dvh w-3/4  border-l data-closed:slide-out-to-right data-open:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

interface SheetContentProps
  extends
    StyledProps<typeof Parts.DialogContent>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Parts.DialogContent>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Parts.DialogContent
      container={typeof document === 'undefined' ? null : document.body}
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <Parts.DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-open:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Parts.DialogClose>
    </Parts.DialogContent>
  </SheetPortal>
))
SheetContent.displayName = 'SheetContent'

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({
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
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Parts.DialogTitle>,
  StyledProps<typeof Parts.DialogTitle>
>(({ className, ...props }, ref) => (
  <Parts.DialogTitle
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Parts.DialogDescription>,
  StyledProps<typeof Parts.DialogDescription>
>(({ className, ...props }, ref) => (
  <Parts.DialogDescription
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = 'SheetDescription'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
