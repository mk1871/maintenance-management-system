<script lang="ts" setup>
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-vue-next'
import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  tasks: TaskWithRelations[]
}>()

const emit = defineEmits<{
  (e: 'view-task', taskId: string): void
}>()

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
</script>

<template>
  <Alert v-if="tasks.length > 0" variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertTitle>Tareas Vencidas</AlertTitle>
    <AlertDescription>
      <div class="space-y-2 mt-2">
        <p>Hay {{ tasks.length }} tarea(s) vencida(s) que requieren atención:</p>
        <div class="space-y-2">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center justify-between bg-background/50 p-3 rounded-md"
          >
            <div class="flex-1">
              <p class="font-medium">{{ task.accommodation?.code }}</p>
              <p class="text-sm text-muted-foreground">{{ task.description }}</p>
              <p v-if="task.estimated_cost" class="text-sm mt-1">
                Costo estimado: {{ formatCurrency(task.estimated_cost) }}
              </p>
            </div>
            <Button size="sm" variant="outline" @click="emit('view-task', task.id)">
              Ver detalles
            </Button>
          </div>
        </div>
      </div>
    </AlertDescription>
  </Alert>
</template>
