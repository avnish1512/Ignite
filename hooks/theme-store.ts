/**
 * Theme store — derives a color palette from the dark mode setting.
 * Import { useTheme } from '@/hooks/theme-store' in any screen to
 * get live-updating themed colors.
 */
import { useMemo } from 'react';
import { useSettings } from './settings-store';

export const LIGHT_THEME = {
  background:     '#F9FAFB',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F3F4F6',
  border:         '#F3F4F6',
  borderStrong:   '#E5E7EB',
  text:           '#111827',
  textSecondary:  '#6B7280',
  textMuted:      '#9CA3AF',
  primary:        '#6366F1',
  primaryLight:   '#EEF2FF',
  danger:         '#EF4444',
  dangerLight:    '#FEF2F2',
  success:        '#10B981',
  warning:        '#F59E0B',
  switchTrackOff: '#F3F4F6',
  switchTrackOn:  '#6366F1',
  tabBar:         '#FFFFFF',
  shadow:         '#000000',
  isDark:         false,
} as const;

export const DARK_THEME = {
  background:     '#0F0F11',
  surface:        '#1C1C1E',
  surfaceAlt:     '#2C2C2E',
  border:         '#2C2C2E',
  borderStrong:   '#3A3A3C',
  text:           '#F9FAFB',
  textSecondary:  '#9CA3AF',
  textMuted:      '#6B7280',
  primary:        '#818CF8',
  primaryLight:   '#1E1B4B',
  danger:         '#F87171',
  dangerLight:    '#3B1515',
  success:        '#34D399',
  warning:        '#FBBF24',
  switchTrackOff: '#3A3A3C',
  switchTrackOn:  '#818CF8',
  tabBar:         '#1C1C1E',
  shadow:         '#000000',
  isDark:         true,
} as const;

export type Theme = typeof LIGHT_THEME;

/** Returns the current theme colors, re-renders when dark mode changes. */
export function useTheme(): Theme {
  const darkMode = useSettings((s) => s.darkMode);
  return useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode]);
}
