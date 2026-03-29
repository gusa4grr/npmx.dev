import { object, string, boolean, nullable, optional, picklist, type InferOutput } from 'valibot'
import { ACCENT_COLOR_IDS, BACKGROUND_THEME_IDS } from '#shared/utils/constants'

const AccentColorIdSchema = picklist(ACCENT_COLOR_IDS)
const BackgroundThemeIdSchema = picklist(BACKGROUND_THEME_IDS)
const ColorModePreferenceSchema = picklist(['light', 'dark', 'system'])
const SearchProviderSchema = picklist(['npm', 'algolia'])

export const UserPreferencesSchema = object({
  /** Display dates as relative (e.g., "3 days ago") instead of absolute */
  relativeDates: optional(boolean()),
  /** Include @types/* package in install command for packages without built-in types */
  includeTypesInInstall: optional(boolean()),
  /** Accent color theme ID */
  accentColorId: optional(nullable(AccentColorIdSchema)),
  /** Preferred background shade */
  preferredBackgroundTheme: optional(nullable(BackgroundThemeIdSchema)),
  /** Hide platform-specific packages (e.g., @scope/pkg-linux-x64) from search results */
  hidePlatformPackages: optional(boolean()),
  /** User-selected locale code */
  selectedLocale: optional(nullable(string())),
  /** Color mode preference: 'light', 'dark', or 'system' */
  colorModePreference: optional(nullable(ColorModePreferenceSchema)),
  /** Search provider for package search: 'npm' or 'algolia' */
  searchProvider: optional(SearchProviderSchema),
  /** Whether keyboard shortcuts are enabled globally */
  keyboardShortcuts: optional(boolean()),
  /** Whether search runs as user types (vs requiring explicit submit) */
  instantSearch: optional(boolean()),
  /** Whether the weekly download graph pulse animation loops continuously */
  enableGraphPulseLooping: optional(boolean()),
  /** Timestamp of last update (ISO 8601) - managed by server */
  updatedAt: optional(string()),
})

export type UserPreferences = InferOutput<typeof UserPreferencesSchema>

export type ColorModePreference = 'light' | 'dark' | 'system'
export type SearchProvider = 'npm' | 'algolia'

/**
 * Default user preferences.
 * Used when creating new user preferences or merging with partial updates.
 */
export const DEFAULT_USER_PREFERENCES: Required<Omit<UserPreferences, 'updatedAt'>> = {
  relativeDates: false,
  includeTypesInInstall: true,
  accentColorId: null,
  preferredBackgroundTheme: null,
  hidePlatformPackages: true,
  selectedLocale: null,
  colorModePreference: null,
  searchProvider: import.meta.test ? 'npm' : 'algolia',
  keyboardShortcuts: true,
  instantSearch: true,
  enableGraphPulseLooping: false,
}

export const USER_PREFERENCES_STORAGE_BASE = 'npmx-kv-user-preferences'
