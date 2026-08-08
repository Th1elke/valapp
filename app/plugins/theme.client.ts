import { THEME_COLORS } from '#shared/cosmetics'

export default defineNuxtPlugin(() => {
  const { data: user } = useUserState()

  watch(
    () => user.value?.equippedTheme,
    (themeId) => {
      const root = document.documentElement.style
      const colors = themeId ? THEME_COLORS[themeId] : undefined
      if (colors) {
        root.setProperty('--primary', colors.primary)
        root.setProperty('--ring', colors.ring)
        root.setProperty('--background', colors.background)
        root.setProperty('--card', colors.card)
      } else {
        root.removeProperty('--primary')
        root.removeProperty('--ring')
        root.removeProperty('--background')
        root.removeProperty('--card')
      }
    },
    { immediate: true },
  )
})
