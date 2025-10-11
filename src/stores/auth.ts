// src/stores/auth.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import type { UserProfile } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const supabaseUser = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => supabaseUser.value !== null && userProfile.value !== null)
  const role = computed(() => userProfile.value?.role ?? null)
  const fullName = computed(() => userProfile.value?.full_name)
  const userId = computed(() => supabaseUser.value?.id ?? null)

  /**
   * Establece el usuario de Supabase
   */
  const setUser = (user: User | null): void => {
    supabaseUser.value = user
  }

  /**
   * Establece el perfil del usuario
   */
  const setUserProfile = (profile: UserProfile | null): void => {
    userProfile.value = profile
    if (profile) error.value = null
  }

  /**
   * Establece un mensaje de error
   */
  const setError = (errorMessage: string | null): void => {
    error.value = errorMessage
  }

  /**
   * Limpia toda la autenticación
   */
  const clearAuth = (): void => {
    supabaseUser.value = null
    userProfile.value = null
    error.value = null
  }

  /**
   * Limpia solo el error
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * Revisa sesión activa y carga perfil de usuario.
   * Optimizado para móviles con reconexión automática.
   */
  const checkAuth = async (retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2

    // Evitar múltiples llamadas simultáneas
    if (isLoading.value && retryCount === 0) {
      console.log('checkAuth already in progress, skipping')
      return
    }

    isLoading.value = true
    clearError()

    // Timeout de 3 segundos en móviles (más corto)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const timeoutDuration = isMobile ? 3000 : 5000

    const timeoutId = setTimeout(() => {
      if (isLoading.value) {
        console.warn(`Auth check timeout (${timeoutDuration}ms)`)
        isLoading.value = false

        // Reintentar en móviles
        if (isMobile && retryCount < MAX_RETRIES) {
          console.log(`Retrying auth check (${retryCount + 1}/${MAX_RETRIES})`)
          setTimeout(() => checkAuth(retryCount + 1), 1000)
        }
      }
    }, timeoutDuration)

    try {
      // Crear AbortController para cancelación
      const controller = new AbortController()
      const abortTimeout = setTimeout(() => controller.abort(), timeoutDuration - 500)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      clearTimeout(abortTimeout)

      if (userError || !user) {
        if (retryCount < MAX_RETRIES && isMobile) {
          console.log('User fetch failed, retrying...')
          clearTimeout(timeoutId)
          isLoading.value = false
          await new Promise((resolve) => setTimeout(resolve, 500))
          return checkAuth(retryCount + 1)
        }
        clearAuth()
        return
      }

      setUser(user)

      // Leer perfil con timeout propio
      const profileController = new AbortController()
      const profileTimeout = setTimeout(() => profileController.abort(), 2000)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      clearTimeout(profileTimeout)

      if (profileError) {
        console.error('Profile not found:', profileError)

        if (retryCount < MAX_RETRIES && isMobile) {
          clearTimeout(timeoutId)
          isLoading.value = false
          await new Promise((resolve) => setTimeout(resolve, 500))
          return checkAuth(retryCount + 1)
        }

        setError('Perfil de usuario no encontrado')
        clearAuth()
        return
      }

      if (profile) {
        setUserProfile(profile)
      } else {
        setError('Perfil de usuario no encontrado')
        clearAuth()
      }
    } catch (err: unknown) {
      console.error('Auth check error:', err)

      // Reintentar en móviles si es error de red
      if (isMobile && retryCount < MAX_RETRIES) {
        clearTimeout(timeoutId)
        isLoading.value = false
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return checkAuth(retryCount + 1)
      }

      // Solo limpiar auth si no es timeout ni error de red
      const errorMsg = (err as Error)?.message ?? ''
      if (!errorMsg.includes('timeout') && !errorMsg.includes('fetch')) {
        clearAuth()
        setError(errorMsg || 'Error desconocido')
      }
    } finally {
      clearTimeout(timeoutId)
      isLoading.value = false
    }
  }

  /**
   * Inicializa el listener de auth state y visibilidad de página
   * Optimizado para móviles
   */
  const initAuth = async (): Promise<() => void> => {
    await checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    // Eventos de visibilidad y focus (importante para móviles)
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        console.log('Tab/App became visible')

        if (isLoading.value) {
          console.log('Forcing loading reset')
          isLoading.value = false
        }

        // Reconectar siempre en móviles cuando vuelves
        if (supabaseUser.value) {
          setTimeout(() => checkAuth(), 100)
        }
      }
    }

    const handlePageShow = (event: PageTransitionEvent): void => {
      // Detectar si viene de bfcache (back-forward cache)
      if (event.persisted) {
        console.log('Page restored from bfcache')
        isLoading.value = false
        if (supabaseUser.value) {
          checkAuth()
        }
      }
    }

    const handleFocus = (): void => {
      // Móviles: reconectar cuando vuelves al navegador
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        if (supabaseUser.value && !isLoading.value) {
          console.log('Window focused on mobile, checking auth')
          checkAuth()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
    }
  }

  return {
    supabaseUser,
    userProfile,
    isLoading,
    error,
    isAuthenticated,
    role,
    fullName,
    userId,
    setUser,
    setUserProfile,
    setError,
    clearAuth,
    clearError,
    checkAuth,
    initAuth,
  }
})
