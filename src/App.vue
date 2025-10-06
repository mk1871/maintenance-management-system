<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import 'vue-sonner/style.css'

const authStore = useAuthStore()

const handleRetryAuth = async () => {
  authStore.clearError()
  authStore.clearAuth()
  await authStore.checkAuth()
}
</script>

<template>
  <div id="app" class="h-screen bg-background text-foreground">
    <Toaster class="pointer-events-auto" />
    <div v-if="authStore.isLoading" class="h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    <DefaultLayout v-else-if="authStore.isAuthenticated && !authStore.error" />
    <div v-else-if="authStore.error" class="h-screen flex items-center justify-center">
      <div class="text-center max-w-md p-8">
        <h2 class="text-2xl font-bold text-foreground mb-4">Error de Autenticación</h2>
        <p class="text-muted-foreground mb-6">{{ authStore.error }}</p>
        <Button @click="handleRetryAuth">Reintentar</Button>
      </div>
    </div>
    <div v-else class="h-screen flex items-center justify-center">
      <RouterView />
    </div>
  </div>
</template>
