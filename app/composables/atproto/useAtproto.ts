import type { PublicUserSessionSchema } from "#shared/schemas/publicUserSession";
import type { InferOutput } from "valibot";

type User = InferOutput<typeof PublicUserSessionSchema>;

export interface UseAtprotoReturn {
  user: Ref<User | null | undefined>;
  pending: Ref<boolean>;
  logout: () => Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __useAtprotoMock: UseAtprotoReturn | undefined
}

function _useAtprotoImpl(): UseAtprotoReturn {
  if (import.meta.test && globalThis.__useAtprotoMock) {
    return globalThis.__useAtprotoMock
  }

  const {
    data: user,
    pending,
    clear,
  } = useFetch('/api/auth/session', {
    server: false,
    immediate: !import.meta.test,
  })

  async function logout() {
    await $fetch('/api/auth/session', {
      method: 'delete',
    })

    clear()
  }

  return { user, pending, logout }
}

// In tests, skip createSharedComposable so each call checks globalThis.__useAtprotoMock fresh.
// In production, import.meta.test is false and the test branch is tree-shaken.
export const useAtproto = import.meta.test
  ? _useAtprotoImpl
  : createSharedComposable(_useAtprotoImpl)
