'use client'
import type { StyledProps } from './part-props'

import * as React from 'react'
import * as Parts from '@ui-sdk/react/slider'

import { cn } from '@/lib/utils'

const Slider = React.forwardRef<
  React.ElementRef<typeof Parts.Slider>,
  StyledProps<typeof Parts.Slider>
>(({ className, ...props }, ref) => (
  <Parts.Slider
    ref={ref}
    className={cn(
      'relative flex w-full touch-none items-center select-none',
      className,
    )}
    {...props}
  >
    <Parts.SliderControl className="relative flex w-full items-center">
      <Parts.SliderTrack className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <Parts.SliderIndicator className="absolute start-(--slider-indicator-start) h-full w-(--slider-indicator-size) bg-primary" />
      </Parts.SliderTrack>
      <Parts.SliderThumb className="absolute start-(--slider-thumb-position) block h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50" />
    </Parts.SliderControl>
  </Parts.Slider>
))
Slider.displayName = 'Slider'

export { Slider }
