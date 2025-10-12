import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme-preference'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('light')

  const isDark = computed(() => currentTheme.value === 'dark')

  const applyTheme = (theme: Theme): void => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    currentTheme.value = theme
  }

  const setTheme = (theme: Theme): void => {
    applyTheme(theme)
  }

  const toggleTheme = (): void => {
    const newTheme: Theme = currentTheme.value === 'dark' ? 'light' : 'dark'
    applyTheme(newTheme)
  }

  const initTheme = (): void => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  }

  const listenToSystemChanges = (): (() => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (!savedTheme) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  return {
    currentTheme: computed(() => currentTheme.value),
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
    listenToSystemChanges,
  }
})
