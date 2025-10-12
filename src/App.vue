<script lang="ts" setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import 'vue-sonner/style.css'

const authStore = useAuthStore()

const handleRetryAuth = async () => {
  authStore.clearError()
  authStore.clearAuth()
  await authStore.checkAuth()
}

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div id="app" class="h-screen bg-background text-foreground">
    <Toaster class="pointer-events-auto" position="bottom-right" />

    <!-- Mostrar spinner SIEMPRE mientras carga autenticación -->
    <div v-if="authStore.isLoading" class="h-screen flex items-center justify-center">
      <Spinner class="h-12 w-12" />
    </div>

    <div v-else-if="authStore.error" class="h-screen flex items-center justify-center">
      <div class="text-center max-w-md p-8">
        <h2 class="text-2xl font-bold text-foreground mb-4">Error de Autenticación</h2>
        <p class="text-muted-foreground mb-6">{{ authStore.error }}</p>
        <Button @click="handleRetryAuth">Reintentar</Button>
      </div>
    </div>

    <DefaultLayout v-else>
      <router-view />
    </DefaultLayout>
  </div>
</template>
