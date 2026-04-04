export function useCodeContainer() {
  const { localSettings } = useUserLocalSettings()

  const codeContainerFull = computed(() => localSettings.value.codeContainerFull)

  function toggleCodeContainer() {
    localSettings.value.codeContainerFull = !localSettings.value.codeContainerFull
  }

  return {
    codeContainerFull,
    toggleCodeContainer,
  }
}
