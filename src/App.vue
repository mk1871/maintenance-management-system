<template>
  <div id="app" class="h-screen bg-background text-foreground">
    <DefaultLayout v-if="authStore.isAuthenticated" />
    <div v-else class="h-screen flex items-center justify-center">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.checkAuth()
})
</script>
