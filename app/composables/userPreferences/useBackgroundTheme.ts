export function useBackgroundTheme() {
  const { preferences } = useUserPreferencesState()
  const { t } = useI18n()

  const bgThemeLabels = computed<Record<BackgroundThemeId, string>>(() => ({
    neutral: t('settings.background_themes.neutral'),
    stone: t('settings.background_themes.stone'),
    zinc: t('settings.background_themes.zinc'),
    slate: t('settings.background_themes.slate'),
    black: t('settings.background_themes.black'),
  }))

  const backgroundThemes = computed(() =>
    Object.entries(BACKGROUND_THEMES).map(([id, value]) => ({
      id: id as BackgroundThemeId,
      label: bgThemeLabels.value[id as BackgroundThemeId],
      value,
    })),
  )

  function setBackgroundTheme(id: BackgroundThemeId | null) {
    if (import.meta.server) {
      preferences.value.preferredBackgroundTheme = id
      return
    }
    if (id) {
      document.documentElement.dataset.bgTheme = id
    } else {
      document.documentElement.removeAttribute('data-bg-theme')
    }
    preferences.value.preferredBackgroundTheme = id
  }

  return {
    backgroundThemes,
    selectedBackgroundTheme: computed(() => preferences.value.preferredBackgroundTheme),
    setBackgroundTheme,
  }
}
