<template>
  <div class="relative">
    <LoginForm />
    <div class="mt-4 text-center text-sm absolute bottom-4 right-0 left-0">
      ¿No tienes cuenta?
      <RouterLink to="/register" class="font-medium underline underline-offset-4 text-primary ml-1">
        Regístrate aquí
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/auth/LoginForm.vue'
</script>