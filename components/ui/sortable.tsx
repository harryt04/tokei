'use client'

import {
  createChange,
  createReorder,
  createRovingFocus,
  definePrimitive,
  type ChangeDetails,
  type ReorderDraft,
  type ReorderReason,
} from '@ui-sdk/core'
import { createParts } from '@ui-sdk/react/primitive'
import {
  createContext,
  Fragment,
  useContext,
  useId,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type SortableOptions = {
  value: string[]
  onValueChange: (
    value: string[],
    details: ChangeDetails<ReorderReason>,
  ) => void
  orientation?: 'vertical' | 'horizontal'
  label?: (key: string) => string | undefined
  /** Drag a floating copy that a scroll container cannot clip, and scroll it near its edges. */
  preview?: boolean
  instructionsId: string
}

const sortable = definePrimitive({
  name: 'sortable',
  options: {
    value: 'list',
    onValueChange: 'callback',
    orientation: 'string',
    label: 'callback',
    preview: 'boolean',
    instructionsId: 'string',
  },
  controlled: ['value'],
  state: (options: SortableOptions) => ({
    value: options.value,
    moving: null as ReorderDraft | null,
    focused: null as string | null,
  }),
  sync: ({ value }) => ({ value }),
  api: (context) => {
    const change = createChange(context)
    const orientation = () => context.options().orientation ?? 'vertical'
    const reorder = createReorder(context, {
      slot: 'item',
      key: 'value',
      draft: 'moving',
      orientation,
      preview: context.options().preview ?? false,
      // Start scrolling a little further in, so an overlay at the scroller's
      // edge (such as the swimlane's add-step button) does not hide the zone.
      createAutoScroll: { edge: 72, speed: 16 },
      label: (key) => context.options().label?.(key),
      set: (value, details) => change('value', value, details),
    })
    const roving = createRovingFocus(context, {
      slot: 'handle',
      key: 'focused',
      orientation,
    })

    return {
      reorder,
      roving,
      instructionsId: () => context.options().instructionsId,
    }
  },
  slots: (slot) => ({
    root: slot<Record<never, never>, { order: string[] }>({
      state: (state, { api }) => ({ order: api.reorder.order(state) }),
    }),
    item: slot<{ value: string }>({
      props: { value: 'string' },
      attrs: (state, { key, api }) => ({
        'data-tokei-grabbed': api.reorder.moving(state, key) ? '' : undefined,
        'data-tokei-dragging': api.reorder.dragging(state, key)
          ? ''
          : undefined,
      }),
      bind: (el, part) => part.api.reorder.bind(el, part),
    }),
    handle: slot<{ value: string }>({
      props: { value: 'string' },
      attrs: (state, part) => ({
        type: 'button',
        tabindex: part.api.roving.tabIndex(state, part),
        'aria-describedby': part.api.instructionsId(),
      }),
      on: {
        keydown: (event, { el, key, api }) => {
          if (!api.reorder.keydown(event, key) && el) {
            api.roving.keydown(event, el)
          }
        },
        pointerdown: (event, { key, api }) =>
          api.reorder.pointerdown(event, key),
      },
      bind: (el, part) => part.api.roving.bind(el, part),
    }),
  }),
})

const Parts = createParts(sortable, {
  root: 'ul',
  item: 'li',
  handle: 'button',
})
const ItemValue = createContext<string | null>(null)

type SortableListProps = Omit<SortableOptions, 'instructionsId'> & {
  'aria-label': string
  className?: string
  children: (key: string) => ReactNode
}

export function SortableList({ children, ...props }: SortableListProps) {
  const instructionsId = useId()

  return (
    <>
      <span id={instructionsId} className="sr-only">
        Press Space or Enter to pick up or drop. Use the arrow keys to move,
        Home or End to move to either end, and Escape or Tab to cancel.
      </span>
      <Parts.Root {...props} instructionsId={instructionsId} role="list">
        {({ order }) =>
          order.map((key) => <Fragment key={key}>{children(key)}</Fragment>)
        }
      </Parts.Root>
    </>
  )
}

export function SortableItem({
  children,
  className,
  value,
  ...props
}: ComponentProps<'li'> & { value: string }) {
  return (
    <Parts.Item
      {...props}
      value={value}
      className={cn(
        'relative data-[tokei-grabbed]:z-10 data-[tokei-grabbed]:[transform:translate(var(--drag-x,0px),var(--drag-y,0px))]',
        className,
      )}
    >
      <ItemValue.Provider value={value}>{children}</ItemValue.Provider>
    </Parts.Item>
  )
}

type SortableHandleProps = Pick<
  ComponentProps<'button'>,
  'children' | 'className'
> & {
  'aria-label': string
}

export function SortableHandle({ className, ...props }: SortableHandleProps) {
  const value = useContext(ItemValue)
  if (value === null) throw new Error('SortableHandle requires a SortableItem')

  return (
    <Parts.Handle
      {...props}
      value={value}
      className={cn(
        'shrink-0 cursor-grab touch-none rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing',
        className,
      )}
    />
  )
}

// Ignore stale orders if items were added or removed before the commit reaches React.
export function applySortableOrder<T extends { id: string }>(
  items: T[],
  order: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  if (items.length !== order.length || !order.every((key) => byId.has(key)))
    return items
  return order.map((key) => byId.get(key)!)
}
