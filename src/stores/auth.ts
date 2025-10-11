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
   * NUNCA crea el perfil - el trigger de BD lo hace automáticamente.
   * Incluye timeout de seguridad.
   */
  const checkAuth = async (): Promise<void> => {
    // Evitar múltiples llamadas simultáneas
    if (isLoading.value) {
      console.log('checkAuth already in progress, skipping')
      return
    }

    isLoading.value = true
    clearError()

    // Timeout reducido a 5 segundos
    const timeoutId = setTimeout(() => {
      if (isLoading.value) {
        console.warn('Auth check timeout - forcing loading to false')
        isLoading.value = false
        // No setear error, solo forzar que se detenga el loading
      }
    }, 5000)

    try {
      // Intentar obtener usuario con timeout propio
      const userPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User fetch timeout')), 4000)
      })

      const {
        data: { user },
        error: userError,
      } = await Promise.race([userPromise, timeoutPromise])

      if (userError || !user) {
        clearAuth()
        return
      }

      setUser(user)

      // SOLO LEER el perfil, NUNCA insertarlo
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile not found. Trigger should have created it:', profileError)
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
      console.error('Auth check error', err)

      // Si el error es por timeout, no limpiar auth (mantener sesión)
      if ((err as Error)?.message !== 'User fetch timeout') {
        clearAuth()
        setError((err as Error)?.message ?? 'Error desconocido')
      }
    } finally {
      clearTimeout(timeoutId)
      isLoading.value = false
    }
  }

  /**
   * Inicializa el listener de auth state y visibilidad de página
   */
  const initAuth = async (): Promise<() => void> => {
    await checkAuth()

    // Listener de cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    // Listener de visibilidad de página
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        // Cuando vuelves a la pestaña
        console.log('Tab became visible, checking auth...')

        // Si está cargando por más de 1 segundo, forzar reset
        if (isLoading.value) {
          console.log('Forcing loading reset on tab visibility')
          isLoading.value = false
        }

        // Si hay sesión pero no está autenticado, reconectar
        if (supabaseUser.value && !isLoading.value) {
          checkAuth()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Retornar función de cleanup
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
