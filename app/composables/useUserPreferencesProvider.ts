/**
 * Abstraction for user preferences storage
 * Supports both localStorage (for anonymous users) and API-based storage (for authenticated users)
 *
 * Design:
 * - Anonymous users: localStorage only
 * - Authenticated users: localStorage as cache, API as source of truth
 * - Changes sync to server with debounce (2s) and on route change/page unload
 *
 * Module-level singletons are safe here: on the server, useLocalStorage returns
 * a ref with defaults (no real localStorage); on the client, there's only one app instance.
 */

import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_USER_PREFERENCES } from '#shared/schemas/userPreferences'
import {
  arePreferencesEqual,
  mergePreferences,
  type HydratedUserPreferences,
} from '~/utils/preferences-merge'

const STORAGE_KEY = 'npmx-user-preferences'

let cached: ReturnType<typeof createProvider> | null = null
let syncInitialized = false

function createProvider(defaultValue: HydratedUserPreferences) {
  const preferences = useLocalStorage<HydratedUserPreferences>(STORAGE_KEY, defaultValue, {
    mergeDefaults: true,
  })

  const isAuthenticated = shallowRef(false)
  const status = shallowRef<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const lastSyncedAt = shallowRef<Date | null>(null)
  const error = shallowRef<string | null>(null)

  const isSyncing = computed(() => status.value === 'syncing')
  const isSynced = computed(() => status.value === 'synced')
  const hasError = computed(() => status.value === 'error')

  async function initSync(): Promise<void> {
    if (syncInitialized || import.meta.server) return
    const { applyStoredColorMode } = useColorModePreference()

    syncInitialized = true

    // Resolve auth + sync dependencies lazily
    const { user } = useAtproto()
    watch(
      () => !!user.value?.did,
      v => {
        isAuthenticated.value = v
      },
      { immediate: true },
    )

    const {
      status: syncStatus,
      lastSyncedAt: syncLastSyncedAt,
      error: syncError,
      loadFromServer,
      scheduleSync,
      setupRouteGuard,
      setupBeforeUnload,
    } = useUserPreferencesSync(isAuthenticated)

    watch(
      syncStatus,
      v => {
        status.value = v
      },
      { immediate: true },
    )
    watch(
      syncLastSyncedAt,
      v => {
        lastSyncedAt.value = v
      },
      { immediate: true },
    )
    watch(
      syncError,
      v => {
        error.value = v
      },
      { immediate: true },
    )

    async function syncWithServer(): Promise<void> {
      const serverResult = await loadFromServer()

      // If the server load failed, keep current local preferences untouched
      if (hasError.value) return

      const { merged, shouldPushToServer } = mergePreferences(preferences.value, serverResult)
      if (shouldPushToServer) {
        scheduleSync(preferences.value)
      } else if (!arePreferencesEqual(preferences.value, merged)) {
        preferences.value = merged
      }
    }

    setupRouteGuard(() => preferences.value)
    setupBeforeUnload(() => preferences.value)

    if (isAuthenticated.value) {
      await syncWithServer()
    }

    applyStoredColorMode()

    watch(
      preferences,
      newPrefs => {
        if (isAuthenticated.value) {
          scheduleSync(newPrefs)
        }
      },
      { deep: true },
    )

    watch(isAuthenticated, async newIsAuth => {
      if (newIsAuth) {
        await syncWithServer()
      }
    })
  }

  return {
    data: preferences,
    isAuthenticated,
    isSyncing,
    isSynced,
    hasError,
    syncError: error,
    lastSyncedAt,
    initSync,
  }
}

export function useUserPreferencesProvider(
  defaultValue: HydratedUserPreferences = DEFAULT_USER_PREFERENCES,
) {
  if (!cached) {
    cached = createProvider(defaultValue)
  }
  return cached
}

/**
 * Reset module-level singleton state. Test-only — do not use in production code.
 */
export function __resetPreferencesForTest(): void {
  if (import.meta.test) {
    cached = null
    syncInitialized = false
  }
}
