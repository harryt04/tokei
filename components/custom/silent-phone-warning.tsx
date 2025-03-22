'use client'
import { SpeakerLoudIcon } from '@radix-ui/react-icons'
import React, { useState } from 'react'
import { Button } from '../ui/button'

function SilentPhoneWarning() {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <div className="flex flex-row justify-center gap-4 px-6 py-4 md:hidden">
      <p className="text-sm">
        You need to take your phone off silent/vibrate mode to hear the alarms!
      </p>
      <Button variant="destructive" onClick={() => setHidden(true)}>
        Dismiss
      </Button>
    </div>
  )
}

export default SilentPhoneWarning
