// src/composables/useTheme.ts

import { ref, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'theme-preference'

export const useTheme = () => {
  const theme = ref<Theme>('system')

  /**
   * Aplica el tema al documento
   */
  const applyTheme = (newTheme: Theme): void => {
    const root = document.documentElement

    // Remover clases anteriores
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      // Detectar preferencia del sistema
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  /**
   * Cambia el tema
   */
  const setTheme = (newTheme: Theme): void => {
    theme.value = newTheme
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  /**
   * Alterna entre light y dark
   */
  const toggleTheme = (): void => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  /**
   * Inicializa el tema desde localStorage o sistema
   */
  const initTheme = (): void => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const initialTheme = savedTheme || 'system'
    theme.value = initialTheme
    applyTheme(initialTheme)
  }

  // Escuchar cambios en la preferencia del sistema
  onMounted(() => {
    initTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (): void => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  })

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
