import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import type { UserProfile } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  // State
  const supabaseUser = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => supabaseUser.value !== null && userProfile.value !== null)
  const role = computed(() => userProfile.value?.role || null)
  const fullName = computed(() => userProfile.value?.full_name || '')
  const userId = computed(() => supabaseUser.value?.id || null)

  // Actions
  const setUser = (user: User | null) => {
    supabaseUser.value = user
    // No limpiar el error aquí, puede ser útil para mostrar mensajes
  }

  const setUserProfile = (profile: UserProfile | null) => {
    userProfile.value = profile
    // Limpiar error cuando se establece el perfil correctamente
    if (profile) {
      error.value = null
    }
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

  const checkAuth = async () => {
    // Evitar llamadas múltiples simultáneas
    if (isLoading.value) {
      return
    }
    
    isLoading.value = true
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // User is not authenticated
        clearAuth()
        return
      }

      // Set the Supabase user
      setUser(user)

      // Get the extended user profile from our custom table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Error al cargar el perfil de usuario')
        return
      }

      if (profile) {
        setUserProfile(profile)
      } else {
        // If no profile exists in our custom table
        setError('Usuario no encontrado en la base de datos')
        clearAuth()
      }
    } catch (err) {
      console.error('Auth check error:', err)
      clearAuth()
      setError((err as Error)?.message || 'Error desconocido')
    } finally {
      isLoading.value = false
    }
  }

  // Sync auth state on store initialization
  const initAuth = async () => {
    await checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = await supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }

  return {
    // State
    supabaseUser,
    userProfile,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    role,
    fullName,
    userId,
    
    // Actions
    setUser,
    setUserProfile,
    setError,
    clearAuth,
    clearError,
    checkAuth,
    initAuth
  }
})