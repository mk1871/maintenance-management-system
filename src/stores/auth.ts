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

  const setUser = (user: User | null): void => {
    supabaseUser.value = user
  }

  const setUserProfile = (profile: UserProfile | null): void => {
    userProfile.value = profile
    if (profile) error.value = null
  }

  const setError = (errorMessage: string | null): void => {
    error.value = errorMessage
  }

  const clearAuth = (): void => {
    supabaseUser.value = null
    userProfile.value = null
    error.value = null
  }

  const clearError = (): void => {
    error.value = null
  }

  /**
   * Revisa sesión activa y carga perfil de usuario.
   * NUNCA crea el perfil - el trigger de BD lo hace automáticamente.
   */
  const checkAuth = async (): Promise<void> => {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
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

      if (profileError || !profile) {
        setError('Perfil de usuario no encontrado')
        clearAuth()
        return
      }
      setUserProfile(profile)
    } catch (err: unknown) {
      clearAuth()
      setError((err as Error)?.message ?? 'Error desconocido')
    } finally {
      isLoading.value = false
    }
  }


  /**
   * Inicializa el listener de auth state
   */
  const initAuth = async (): Promise<() => void> => {
    await checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
      // Ignorar USER_UPDATED, TOKEN_REFRESHED, INITIAL_SESSION
    })

    return subscription.unsubscribe
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
