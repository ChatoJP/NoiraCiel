/**
 * onboardingStorage.ts — client-side persistence for the onboarding profile.
 *
 * MVP: localStorage only, no login. Later this can be swapped for an account
 * store with the same shape. All functions are SSR-safe (guard `window`).
 */

import type { UserProfile } from '@/types/noiracielOnboarding'

const KEY = 'noiraciel.profile.v1'

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    /* storage may be unavailable (private mode); fail soft */
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserProfile
    if (parsed && parsed.version === 1 && parsed.pathId) return parsed
    return null
  } catch {
    return null
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* fail soft */
  }
}
