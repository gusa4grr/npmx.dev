/**
 * Bridge SSR payload when the resolved search provider on the client differs
 * from the server default ('algolia'). Copies the SSR-cached data to the
 * client's cache key so `useLazyAsyncData` hydrates without a refetch.
 *
 * Must be called at composable setup time (not inside an async callback).
 */
export function bridgeSearchSSRPayload(
  prefix: string,
  identifier: MaybeRefOrGetter<string>,
  provider: MaybeRefOrGetter<string>,
): void {
  if (import.meta.client) {
    const nuxtApp = useNuxtApp()
    const id = toValue(identifier)
    const p = toValue(provider)

    if (nuxtApp.isHydrating && id && p !== 'algolia') {
      const ssrKey = `${prefix}:algolia:${id}`
      const clientKey = `${prefix}:${p}:${id}`
      if (nuxtApp.payload.data[ssrKey] && !nuxtApp.payload.data[clientKey]) {
        nuxtApp.payload.data[clientKey] = nuxtApp.payload.data[ssrKey]
      }
    }
  }
}

export function metaToSearchResult(meta: PackageMetaResponse): NpmSearchResult {
  return {
    package: {
      name: meta.name,
      version: meta.version,
      description: meta.description,
      keywords: meta.keywords,
      license: meta.license,
      date: meta.date,
      links: meta.links,
      author: meta.author,
      maintainers: meta.maintainers,
    },
    searchScore: 0,
    downloads: meta.weeklyDownloads !== undefined ? { weekly: meta.weeklyDownloads } : undefined,
    updated: meta.date,
  }
}

export function emptySearchResponse(): NpmSearchResponse {
  return {
    objects: [],
    total: 0,
    isStale: false,
    time: new Date().toISOString(),
  }
}

export interface SearchSuggestion {
  type: 'user' | 'org'
  name: string
  exists: boolean
}

export type SuggestionIntent = 'user' | 'org' | 'both' | null

export function isValidNpmName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 214) return false
  if (!/^[a-z0-9]/i.test(name)) return false
  return /^[\w-]+$/.test(name)
}

/** Parse a search query into a suggestion intent (`~user`, `@org`, or plain `both`). */
export function parseSuggestionIntent(query: string): { intent: SuggestionIntent; name: string } {
  const q = query.trim()
  if (!q) return { intent: null, name: '' }

  if (q.startsWith('~')) {
    const name = q.slice(1)
    return isValidNpmName(name) ? { intent: 'user', name } : { intent: null, name: '' }
  }

  if (q.startsWith('@')) {
    if (q.includes('/')) return { intent: null, name: '' }
    const name = q.slice(1)
    return isValidNpmName(name) ? { intent: 'org', name } : { intent: null, name: '' }
  }

  return isValidNpmName(q) ? { intent: 'both', name: q } : { intent: null, name: '' }
}
