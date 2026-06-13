import React from 'react'
import Svg, { Path } from 'react-native-svg'

// Custom "Fuel" glyph with the same prop API as a lucide-react-native icon so it
// drops in identically alongside Moon / Dumbbell / Pencil / User. Same viewBox +
// path d-strings as the web version.
export interface FuelIconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

export function FuelIcon({ size = 24, color = 'currentColor', strokeWidth = 1.5 }: FuelIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M6.5 3.2V8.4M9 3.2V8.4M11.5 3.2V8.4" />
      <Path d="M6.5 8.4Q9 10.6 11.5 8.4" />
      <Path d="M9 10.2V20.8" />
      <Path d="M16.6 3.2V20.8" />
      <Path d="M16.6 3.2Q19.6 6 16.6 11.6" />
    </Svg>
  )
}
