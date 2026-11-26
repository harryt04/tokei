'use client'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

export function Portal({
  children,
  container,
}: {
  children?: ReactNode
  container?: Element | null
}) {
  return typeof document === 'undefined'
    ? null
    : createPortal(children, container ?? document.body)
}
