import type { SearchProvider } from '#shared/schemas/userPreferences'
import { normalizeSearchParam } from '#shared/utils/url'

export function useSearchProvider() {
  const { preferences } = useUserPreferencesState()
  const route = useRoute()

  const searchProvider = computed({
    get: () => {
      const p = normalizeSearchParam(route.query.p)
      if (p === 'npm' || p === 'algolia') return p
      return preferences.value.searchProvider ?? 'algolia'
    },
    set: (value: SearchProvider) => {
      preferences.value.searchProvider = value
    },
  })

  const isAlgolia = computed(() => searchProvider.value === 'algolia')

  function toggle() {
    searchProvider.value = searchProvider.value === 'npm' ? 'algolia' : 'npm'
  }

  return {
    searchProvider,
    isAlgolia,
    toggle,
  }
}
