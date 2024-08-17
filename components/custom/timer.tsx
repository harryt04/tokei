'use client'
import { ColorHex, CountdownCircleTimer } from 'react-countdown-circle-timer'

type TimerProps = {
  duration: number
}

type Colors = { 0: ColorHex } & { 1: ColorHex } & ColorHex[]
type ColorTimes = { 0: number } & { 1: number } & number[]

const colors: Colors = [
  '#FF0000', // Red
  '#FF3300', // Reddish Orange
  '#FF6600', // Orange
  '#FF9900', // Yellowish Orange
  '#FFCC00', // Gold
  '#FFFF00', // Yellow
  '#CCFF00', // Lime Yellow
  '#99FF00', // Lime Green
  '#66FF00', // Bright Green
  '#33FF00', // Lime
  '#00FF00', // Green
  '#00FF33', // Spring Green
  '#00FF66', // Medium Spring Green
  '#00FF99', // Aquamarine
  '#00FFCC', // Turquoise
  '#00FFFF', // Cyan
  '#00CCFF', // Deep Sky Blue
  '#0099FF', // Dodger Blue
  '#0066FF', // Blue
  '#0033FF', // Royal Blue
  '#0000FF', // Indigo
  '#3300FF', // Electric Indigo
  '#6600FF', // Violet
  '#9900FF', // Purple
  '#CC00FF', // Deep Magenta
  '#FF00FF', // Magenta
  '#FF00CC', // Reddish Magenta
  '#FF0099', // Hot Pink
  '#FF0066', // Pinkish Red
  '#FF0033', // Reddish Pink
  '#FF0000', // Red
  '#FF3300', // Reddish Orange
  '#FF6600', // Orange
  '#FF9900', // Yellowish Orange
  '#FFCC00', // Gold
  '#FFFF00', // Yellow
]

const getColorTimes = (duration: number): ColorTimes => {
  const colorsTime: number[] = []
  const scaleFactor = duration / (colors.length - 1)
  if (scaleFactor < 0) return colorsTime as unknown as ColorTimes
  for (let i = duration; i > 0; i = i - scaleFactor) {
    const timeStepCode = Math.round(i * 100) / 100
    colorsTime.push(timeStepCode)
  }
  return colorsTime as unknown as ColorTimes
}

function Timer(props: TimerProps) {
  const { duration } = props
  const colorsTime = getColorTimes(duration)
  return (
    <>
      <CountdownCircleTimer
        isPlaying
        duration={duration}
        colors={colors}
        colorsTime={colorsTime}
      >
        {({ remainingTime }) =>
          remainingTime > 0 ? (
            <>
              {Math.floor(remainingTime / 60)}:{Math.ceil(remainingTime % 60)}
            </>
          ) : (
            <>Completed</>
          )
        }
      </CountdownCircleTimer>
    </>
  )
}

export { Timer }
