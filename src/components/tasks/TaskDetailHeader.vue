<script lang="ts" setup>
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TaskEditDialog from './TaskEditDialog.vue'
import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  task: TaskWithRelations
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'updated'): void
}>()

const formatPriority = (priority: string): string => {
  const priorities: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return priorities[priority] || priority
}

const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return statuses[status] || status
}

const getStatusVariant = (status: string): 'default' | 'outline' | 'secondary' | 'destructive' => {
  const variants: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
  }
  return variants[status] ?? 'secondary'
}

const getStatusClasses = (status: string): string => {
  if (status === 'completed') {
    return 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
  }
  return ''
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <Button aria-label="Volver a tareas" size="icon" variant="outline" @click="emit('back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tarea #{{ task.id.substring(0, 8) }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ task.accommodation?.code }} - {{ task.accommodation?.name }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <TaskEditDialog :task="task" @updated="emit('updated')" />
      <Badge :variant="getPriorityVariant(task.priority)">
        {{ formatPriority(task.priority) }}
      </Badge>
      <Badge :class="getStatusClasses(task.status)" :variant="getStatusVariant(task.status)">
        {{ formatStatus(task.status) }}
      </Badge>
    </div>
  </div>
</template>
