<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-vue-next'

defineEmits<{
  (e: 'navigate-tasks'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Vista general del sistema de mantenimiento</p>
    </div>
    <Button @click="$emit('navigate-tasks')">
      Ver todas las tareas
      <ArrowRight class="ml-2 h-4 w-4" />
    </Button>
  </div>
</template>
