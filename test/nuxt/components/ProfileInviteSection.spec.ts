import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const { mockUseProfileLikes } = vi.hoisted(() => ({
  mockUseProfileLikes: vi.fn(),
}))

mockNuxtImport('useProfileLikes', () => mockUseProfileLikes)

import ProfilePage from '~/pages/profile/[identity]/index.vue'

registerEndpoint('/api/social/profile/test-handle', () => ({
  displayName: 'Test User',
  description: '',
  website: '',
  handle: 'test-handle',
  recordExists: false,
}))

function mockUseAtproto(
  overrides: {
    user?: Ref<Record<string, unknown> | null>
    pending?: Ref<boolean>
    logout?: () => Promise<void>
  } = {},
) {
  globalThis.__useAtprotoMock = {
    user: ref(null),
    pending: ref(false),
    logout: vi.fn(),
    ...overrides,
  } as UseAtprotoReturn
}

describe('Profile invite section', () => {
  beforeEach(() => {
    mockUseProfileLikes.mockReset()
  })

  afterEach(() => {
    globalThis.__useAtprotoMock = undefined
  })

  it('does not show invite section while auth is still loading', async () => {
    mockUseAtproto({ pending: ref(true) })

    mockUseProfileLikes.mockReturnValue({
      data: ref({ records: [] }),
      status: ref('success'),
    })

    const wrapper = await mountSuspended(ProfilePage, {
      route: '/profile/test-handle',
    })

    expect(wrapper.text()).not.toContain("It doesn't look like they're using npmx yet")
  })

  it('shows invite section after auth resolves for non-owner', async () => {
    mockUseAtproto({ user: ref({ handle: 'other-user' }) })

    mockUseProfileLikes.mockReturnValue({
      data: ref({ records: [] }),
      status: ref('success'),
    })

    const wrapper = await mountSuspended(ProfilePage, {
      route: '/profile/test-handle',
    })

    expect(wrapper.text()).toContain("It doesn't look like they're using npmx yet")
  })

  it('does not show invite section for profile owner', async () => {
    mockUseAtproto({ user: ref({ handle: 'test-handle' }) })

    mockUseProfileLikes.mockReturnValue({
      data: ref({ records: [] }),
      status: ref('success'),
    })

    const wrapper = await mountSuspended(ProfilePage, {
      route: '/profile/test-handle',
    })

    expect(wrapper.text()).not.toContain("It doesn't look like they're using npmx yet")
  })
})
