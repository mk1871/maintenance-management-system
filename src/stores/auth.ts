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
  const lastCheckTime = ref<number>(0) // ✅ NUEVO: timestamp del último check

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
   * Con prevención de llamadas múltiples simultáneas.
   */
  const checkAuth = async (): Promise<void> => {
    const now = Date.now()
    const MIN_TIME_BETWEEN_CHECKS = 2000 // ✅ Mínimo 2 segundos entre checks

    // ✅ PREVENCIÓN 1: Evitar si ya está cargando
    if (isLoading.value) {
      console.log('checkAuth already in progress, skipping')
      return
    }

    // ✅ PREVENCIÓN 2: Evitar si se llamó hace menos de 2 segundos
    if (now - lastCheckTime.value < MIN_TIME_BETWEEN_CHECKS) {
      console.log('checkAuth called too soon, skipping')
      return
    }

    lastCheckTime.value = now
    isLoading.value = true
    clearError()

    // Timeout de 5 segundos
    const timeoutId = setTimeout(() => {
      if (isLoading.value) {
        console.warn('Auth check timeout - forcing loading to false')
        isLoading.value = false
      }
    }, 5000)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        clearAuth()
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile not found:', profileError)
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
      clearAuth()
      setError((err as Error)?.message ?? 'Error desconocido')
    } finally {
      clearTimeout(timeoutId)
      isLoading.value = false
    }
  }

  /**
   * Inicializa el listener de auth state
   * SIN listeners de visibilidad para evitar loops
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

    // ✅ ELIMINADO: listeners de visibilidad que causaban el loop

    return () => {
      subscription.unsubscribe()
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
