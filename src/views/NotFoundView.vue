<template>
  <div class="container mx-auto py-12 text-center">
    <h1 class="text-4xl font-bold text-foreground mb-4">404 - Página no encontrada</h1>
    <p class="text-lg text-muted-foreground mb-8">La página que estás buscando no existe.</p>
    <Button @click="$router.push('/')">
      Volver al Inicio
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>