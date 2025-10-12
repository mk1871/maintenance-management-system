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

  const isAuthenticated = computed(() =>
    supabaseUser.value !== null && userProfile.value !== null
  )
  const fullName = computed(() => userProfile.value?.full_name ?? '')
  const role = computed(() => userProfile.value?.role ?? null)

  const setUser = (user: User | null) => { supabaseUser.value = user }
  const setUserProfile = (profile: UserProfile | null) => {
    userProfile.value = profile
    if (profile) error.value = null
  }
  const setError = (msg: string | null) => { error.value = msg }
  const clearAuth = () => {
    supabaseUser.value = null
    userProfile.value = null
    error.value = null
  }

  const checkAuth = async (): Promise<void> => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { clearAuth(); return }
      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      if (profileError || !profile) { clearAuth(); setError('Perfil no encontrado'); return }
      setUserProfile(profile)
    } catch (err: unknown) {
      clearAuth()
      setError((err as Error).message || 'Error desconocido')
    } finally {
      isLoading.value = false
    }
  }

  const initAuth = async (): Promise<() => void> => {
    await checkAuth()

    // ✅ Listener de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, 'Session:', !!session)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            if (!userProfile.value) {
              await checkAuth()
            }
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuth()
        }
      }
    )

    // ✅ NUEVO: Listener de visibilidad para móviles
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App visible again - checking auth')
        // Solo verificar si ya estábamos autenticados
        if (supabaseUser.value) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            // Recargar perfil si no lo tenemos
            if (!userProfile.value) {
              await checkAuth()
            }
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
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
    fullName,
    role,
    checkAuth,
    initAuth,
    clearAuth,
    setError,
  }
})
