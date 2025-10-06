/**
 * Pinia Auth Store refactorizado para Supabase v2 API
 */
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

  const setUser = (user: User | null) => {
    supabaseUser.value = user
  }

  const setUserProfile = (profile: UserProfile | null) => {
    userProfile.value = profile
    if (profile) error.value = null
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearAuth = () => {
    supabaseUser.value = null
    userProfile.value = null
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  /**
   * Revisa sesión activa y carga perfil de usuario.
   * Crea perfil si no existe, usando nueva API v2 Supabase.
   */
  const checkAuth = async (): Promise<void> => {
    if (isLoading.value) return
    isLoading.value = true
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

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error', profileError)
        setError('Error al cargar el perfil de usuario')
        return
      }

      if (profile) {
        setUserProfile(profile)
      } else {
        const defaultProfile: UserProfile = {
          id: user.id,
          full_name: user.email ?? '',
          role: 'supervisor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert(defaultProfile)
          .select()
          .single()
        if (createError) {
          console.error('Error creating user profile', createError)
          setError('Error al crear el perfil de usuario.')
          clearAuth()
          return
        }
        if (newProfile) {
          setUserProfile(newProfile)
        } else {
          setError('No se pudo crear el perfil de usuario.')
          clearAuth()
        }
      }
    } catch (err: unknown) {
      console.error('Auth check error', err)
      clearAuth()
      setError((err as Error)?.message ?? 'Error desconocido')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Inicializa el listener de auth state usando nueva API v2.
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
