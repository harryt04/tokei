'use client'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/toast'
import type { StyledProps } from './part-props'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const QueueContext = React.createContext<ReturnType<
  typeof Parts.createToaster<React.ReactNode>
> | null>(null)
function ToastProvider({
  children,
  duration,
}: {
  children?: React.ReactNode
  duration?: number
}) {
  const [queue] = React.useState(() => Parts.createToaster({ duration }))
  return <QueueContext.Provider value={queue}>{children}</QueueContext.Provider>
}

function ToastViewport({
  className,
  ...props
}: StyledProps<typeof Parts.ToastRegion>) {
  const queue = React.useContext(QueueContext)
  if (!queue) return null
  return (
    <Parts.ToastRegion
      toaster={queue}
      maxVisible={1}
      className={cn(
        'fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]',
        className,
      )}
      {...props}
    >
      {(item) => item.title}
    </Parts.ToastRegion>
  )
}

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-swiping:translate-x-(--toast-swipe-x) data-swiping:translate-y-(--toast-swipe-y) data-swiping:transition-none data-starting-style:animate-in data-ending-style:animate-out data-ending-style:animate-out data-ending-style:fade-out-80 data-ending-style:slide-out-to-right-full data-starting-style:slide-in-from-top-full data-starting-style:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type ToastProps = StyledProps<typeof Parts.Toast> &
  VariantProps<typeof toastVariants> & {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    duration?: number
  }
function Toast({
  className,
  variant,
  children,
  open,
  defaultOpen = true,
  onOpenChange,
  duration,
  ...props
}: ToastProps) {
  const queue = React.useContext(QueueContext)
  const id = React.useId()
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const visible = open ?? localOpen
  React.useEffect(() => {
    if (!queue || !visible) return
    queue({
      id,
      duration,
      title: (
        <Parts.Toast
          {...props}
          className={cn(toastVariants({ variant }), className)}
        >
          {children}
        </Parts.Toast>
      ),
      onDismiss: () => {
        setLocalOpen(false)
        onOpenChange?.(false)
      },
    })
  })
  React.useEffect(() => {
    if (!visible) queue?.dismiss(id)
  }, [queue, id, visible])
  React.useEffect(() => () => queue?.dismiss(id), [queue, id])
  return null
}

const ToastAction = React.forwardRef<
  React.ElementRef<typeof Parts.ToastAction>,
  StyledProps<typeof Parts.ToastAction>
>(({ className, ...props }, ref) => (
  <Parts.ToastAction
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary hover:group-[.destructive]:border-destructive/30 hover:group-[.destructive]:bg-destructive hover:group-[.destructive]:text-destructive-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden focus:group-[.destructive]:ring-destructive disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = 'ToastAction'

const ToastClose = React.forwardRef<
  React.ElementRef<typeof Parts.ToastClose>,
  StyledProps<typeof Parts.ToastClose>
>(({ className, ...props }, ref) => (
  <Parts.ToastClose
    ref={ref}
    className={cn(
      'absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground hover:group-[.destructive]:text-red-50 focus:opacity-100 focus:ring-2 focus:outline-hidden focus:group-[.destructive]:ring-red-400 focus:group-[.destructive]:ring-offset-red-600',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </Parts.ToastClose>
))
ToastClose.displayName = 'ToastClose'

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof Parts.ToastTitle>,
  StyledProps<typeof Parts.ToastTitle>
>(({ className, ...props }, ref) => (
  <Parts.ToastTitle
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = 'ToastTitle'

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof Parts.ToastDescription>,
  StyledProps<typeof Parts.ToastDescription>
>(({ className, ...props }, ref) => (
  <Parts.ToastDescription
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = 'ToastDescription'

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
