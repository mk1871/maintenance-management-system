<script lang="ts" setup>
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import TaskForm from '@/components/tasks/TaskForm.vue'

defineProps<{
  isRefreshing: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'task-created'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tareas</h1>
      <p class="text-muted-foreground">Gestiona todas las tareas de mantenimiento</p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        :disabled="isRefreshing"
        aria-label="Actualizar datos"
        size="icon"
        variant="outline"
        @click="emit('refresh')"
      >
        <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
      </Button>

      <TaskForm @task-created="emit('task-created')" />
    </div>
  </div>
</template>
