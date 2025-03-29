'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AreYouSureDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  description: string
  onConfirmLabel: string
  onCancelLabel: string
}

export default function ConfirmationDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  onConfirmLabel,
  onCancelLabel,
}: AreYouSureDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            {onCancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {onConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
