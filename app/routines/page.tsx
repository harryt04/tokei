'use client'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { RedirectToSignIn, SignedOut } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function Routines() {
  const { open, isMobile } = useSidebar()
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/places?speakerId=${selectedSpeaker?._id}`,
        )
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setPlaces(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch places')
      } finally {
        setLoading(false)
      }
    }

    if (selectedSpeaker) {
      fetchPlaces()
    }
  }, [selectedSpeaker])
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      {(!open || isMobile) && <SidebarTrigger className="ml-2 mt-5 p-5" />}
    </>
  )
}
