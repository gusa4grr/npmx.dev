export const useInstantSearchPreference = () => {
  const { preferences } = useUserPreferencesState()

  return computed({
    get: () => preferences.value.instantSearch,
    set: (value: boolean) => {
      preferences.value.instantSearch = value
    },
  })
}
