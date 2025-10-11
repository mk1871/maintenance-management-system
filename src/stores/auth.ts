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
   * Verifica sesión activa y carga perfil
   */
  const checkAuth = async (): Promise<void> => {
    // Evitar llamadas simultáneas
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

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

      // Cargar perfil
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        setError('Perfil no encontrado')
        clearAuth()
        return
      }

      setUserProfile(profile)
    } catch (err: unknown) {
      console.error('Auth check error:', err)
      clearAuth()
      setError((err as Error)?.message ?? 'Error desconocido')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Inicializa listeners de autenticación
   */
  const initAuth = async (): Promise<() => void> => {
    await checkAuth()

    // ✅ Listener filtrado para evitar loops
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      console.log('Auth event:', event)

      // Solo reaccionar a eventos específicos
      if (event === 'SIGNED_IN') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
      // Ignorar: TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
    })

    return () => subscription.unsubscribe()
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
