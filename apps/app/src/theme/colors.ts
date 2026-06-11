/**
 * Design tokens (docs/phase-4-app-home.md). Tailwind classes cover most
 * styling; these constants exist for the places that need raw hex values:
 * SVG fills, particle colors, navigation theming.
 */
import type { ColorToken } from '@habit/shared';

export const palette = {
  cream: '#FFF8F0',
  ink: '#3D3A4B',
  inkSoft: '#8B87A0',
  violet: '#7C6FF0',
  mint: '#5ED5A8',
  coral: '#FF8A7A',
  sunshine: '#FFD66B',
  sky: '#6BC6FF',
  rose: '#F08FB8',
} as const;

/** Habit `color` values from the API are token names; map them to hexes. */
export const habitColors: Record<ColorToken, { main: string; soft: string }> = {
  violet: { main: '#7C6FF0', soft: '#E9E6FD' },
  mint: { main: '#5ED5A8', soft: '#E0F7EE' },
  coral: { main: '#FF8A7A', soft: '#FFE7E3' },
  sunshine: { main: '#FFD66B', soft: '#FFF4D6' },
  sky: { main: '#6BC6FF', soft: '#E2F3FF' },
  rose: { main: '#F08FB8', soft: '#FCE7F0' },
};

export const colorTokens = Object.keys(habitColors) as ColorToken[];
