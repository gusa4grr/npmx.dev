export function useAccentColor() {
  const { preferences } = useUserPreferencesState()
  const { colorMode } = useColorModePreference()
  const { t } = useI18n()

  const accentColorLabels = computed<Record<AccentColorId, string>>(() => ({
    sky: t('settings.accent_colors.sky'),
    coral: t('settings.accent_colors.coral'),
    amber: t('settings.accent_colors.amber'),
    emerald: t('settings.accent_colors.emerald'),
    violet: t('settings.accent_colors.violet'),
    magenta: t('settings.accent_colors.magenta'),
    neutral: t('settings.clear_accent'),
  }))

  const accentColors = computed(() => {
    const isDark = colorMode.value === 'dark'
    const colors = isDark ? ACCENT_COLORS.dark : ACCENT_COLORS.light

    return Object.entries(colors).map(([id, value]) => ({
      id: id as AccentColorId,
      label: accentColorLabels.value[id as AccentColorId],
      value,
    }))
  })

  function setAccentColor(id: AccentColorId | null) {
    if (import.meta.server) {
      preferences.value.accentColorId = id
      return
    }
    if (id) {
      document.documentElement.style.setProperty('--accent-color', `var(--swatch-${id})`)
    } else {
      document.documentElement.style.removeProperty('--accent-color')
    }
    preferences.value.accentColorId = id
  }

  return {
    accentColors,
    selectedAccentColor: computed(() => preferences.value.accentColorId),
    setAccentColor,
  }
}
