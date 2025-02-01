'use client'

import { useEffect, useState } from 'react'
import { Routine } from '@/models'
import { RoutineComponent } from '@/components/custom/routine-component'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { RoutineForm } from '@/components/custom/routine-form'
import { Switch } from '@/components/ui/switch'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

export default function Dynamic() {
  const { open, isMobile } = useSidebar()

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {(!open || isMobile) && <SidebarTrigger className="ml-2 mt-5 p-5" />}
      </SignedIn>
    </>
  )
}
