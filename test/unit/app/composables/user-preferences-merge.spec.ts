import { describe, expect, it } from 'vitest'
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '#shared/schemas/userPreferences'
import type { ServerPreferencesResult } from '~/composables/useUserPreferencesSync.client'
import {
  arePreferencesEqual,
  mergePreferences,
  type HydratedUserPreferences,
} from '~/utils/preferences-merge'

const createPrefs = (
  overrides: Partial<HydratedUserPreferences> = {},
): HydratedUserPreferences => ({
  ...DEFAULT_USER_PREFERENCES,
  ...overrides,
})

const createServerPrefs = (
  overrides: Partial<UserPreferences> = {},
  includeDefaults = true,
): UserPreferences => ({
  ...(includeDefaults ? DEFAULT_USER_PREFERENCES : {}),
  ...overrides,
})

const createServerResult = (
  isNewUser: boolean,
  preferences: UserPreferences = createServerPrefs(),
): ServerPreferencesResult => ({
  preferences,
  isNewUser,
})

describe('user preferences merge logic', () => {
  describe('arePreferencesEqual', () => {
    it('returns true when all preference keys match', () => {
      const a = createPrefs({ accentColorId: 'magenta' })
      const b = createPrefs({ accentColorId: 'magenta' })
      expect(arePreferencesEqual(a, b)).toBe(true)
    })

    it('returns false when a preference key differs', () => {
      const a = createPrefs({ accentColorId: 'magenta' })
      const b = createPrefs({ accentColorId: 'amber' })
      expect(arePreferencesEqual(a, b)).toBe(false)
    })

    it('ignores updatedAt when comparing', () => {
      const a = createPrefs({ updatedAt: '2025-01-01T00:00:00Z' })
      const b = createPrefs({ updatedAt: '2026-02-28T12:00:00Z' })
      expect(arePreferencesEqual(a, b)).toBe(true)
    })
  })

  describe('first-time user (isNewUser: true)', () => {
    it('preserves local preferences when server has no stored prefs', () => {
      const localPrefs = createPrefs({
        accentColorId: 'magenta',
        colorModePreference: 'dark',
        selectedLocale: 'de',
      })

      const serverResult = createServerResult(true)

      const { merged, shouldPushToServer } = mergePreferences(localPrefs, serverResult)

      expect(merged.accentColorId).toBe('magenta')
      expect(merged.colorModePreference).toBe('dark')
      expect(merged.selectedLocale).toBe('de')
      expect(shouldPushToServer).toBe(true)
    })

    it('local prefs are returned unchanged', () => {
      const localPrefs = createPrefs({
        relativeDates: true,
        keyboardShortcuts: false,
      })

      const serverResult = createServerResult(true)

      const { merged } = mergePreferences(localPrefs, serverResult)

      expect(merged).toEqual(localPrefs)
    })
  })

  describe('returning user (isNewUser: false)', () => {
    it('server preferences override local preferences', () => {
      const localPrefs = createPrefs({
        accentColorId: 'magenta',
        colorModePreference: 'dark',
      })

      const serverResult = createServerResult(
        false,
        createServerPrefs({
          accentColorId: 'amber',
          colorModePreference: 'light',
          updatedAt: '2026-01-15T10:00:00Z',
        }),
      )

      const { merged, shouldPushToServer } = mergePreferences(localPrefs, serverResult)

      expect(merged.accentColorId).toBe('amber')
      expect(merged.colorModePreference).toBe('light')
      expect(shouldPushToServer).toBe(false)
    })

    it('local preferences fill new keys not yet stored on server (schema migration)', () => {
      const localPrefs = createPrefs({
        accentColorId: 'magenta',
        selectedLocale: 'ja',
      })

      // Pass `false` to createServerPrefs to simulate a sparse object without defaults
      const serverResult = createServerResult(
        false,
        createServerPrefs(
          {
            accentColorId: 'emerald',
            updatedAt: '2026-01-15T10:00:00Z',
          },
          false,
        ),
      )

      const { merged } = mergePreferences(localPrefs, serverResult)

      // Server wins on accentColorId
      expect(merged.accentColorId).toBe('emerald')
      // Local fills in selectedLocale (not in server response)
      expect(merged.selectedLocale).toBe('ja')
    })

    it('returning user with default server prefs keeps defaults (not a false first-login)', () => {
      const localPrefs = createPrefs({
        accentColorId: 'magenta',
      })

      const serverResult = createServerResult(
        false,
        createServerPrefs({ updatedAt: '2026-02-01T00:00:00Z' }),
      )

      const { merged, shouldPushToServer } = mergePreferences(localPrefs, serverResult)

      // Server wins — user intentionally has defaults
      expect(merged.accentColorId).toBeNull()
      expect(shouldPushToServer).toBe(false)
    })
  })
})
