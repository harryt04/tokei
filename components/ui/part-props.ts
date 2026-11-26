import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export type StyledProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'children' | 'className'
> & { className?: string; children?: ReactNode }
