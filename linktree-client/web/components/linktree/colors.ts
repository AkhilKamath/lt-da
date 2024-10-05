import { ColorKey } from "./types"

export const colors = {
  red: {
    '--lt-background': '#ef4444',
    '--lt-foreground': '#ffffff'
  },
  yellow: {
    '--lt-background': '#eab308',
    '--lt-foreground': '#000000'
  },
  blue: {
    '--lt-background': '#3b82f6',
    '--lt-foreground': '#ffffff'
  },
  violet: {
    '--lt-background': '#4c1d95',
    '--lt-foreground': '#ffffff'
  },
  green: {
    '--lt-background': '#22c55e',
    '--lt-foreground': '#000000'
  },
  pink: {
    '--lt-background': '#ec4899',
    '--lt-foreground': '#000000'
  },
}

export const hexToColorsKeyMap: Record<string, ColorKey> = {
  '#ef4444': 'red',
  '#eab308': 'yellow',
  '#3b82f6': 'blue',
  '#4c1d95': 'violet',
  '#22c55e': 'green',
  '#ec4899': 'pink'
}