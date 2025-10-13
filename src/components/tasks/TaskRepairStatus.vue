<script lang="ts" setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, CheckCircle2 } from 'lucide-vue-next'
import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  task: TaskWithRelations
}>()

const emit = defineEmits<{
  (e: 'start-repair', repairerName: string): void
  (e: 'complete-task'): void
}>()

const repairerName = ref('')

const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const handleStartRepair = (): void => {
  if (!repairerName.value.trim()) {
    return
  }
  emit('start-repair', repairerName.value.trim())
  repairerName.value = ''
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Clock class="h-5 w-5" />
        Estado de Reparación
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Pendiente -->
      <div v-if="task.status === 'pending'" class="space-y-4">
        <div class="space-y-2">
          <Label for="repairer-name">Reparador</Label>
          <Input
            id="repairer-name"
            v-model="repairerName"
            placeholder="Nombre del reparador"
            @keyup.enter="handleStartRepair"
          />
        </div>
        <Button :disabled="!repairerName.trim()" @click="handleStartRepair">
          Comenzar Reparación
        </Button>
      </div>

      <!-- En Progreso -->
      <div v-else-if="task.status === 'in_progress'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="task.repairer_name" class="space-y-1">
            <Label class="text-muted-foreground">Reparador</Label>
            <p class="font-medium">{{ task.repairer_name }}</p>
          </div>
          <div class="space-y-1">
            <Label class="text-muted-foreground">Fecha de Inicio</Label>
            <p class="font-medium">{{ formatDate(task.start_date) }}</p>
          </div>
        </div>
        <Button @click="emit('complete-task')">
          <CheckCircle2 class="h-4 w-4 mr-2" />
          Completar Tarea
        </Button>
      </div>

      <!-- Completada -->
      <div v-else-if="task.status === 'completed'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="task.repairer_name" class="space-y-1">
            <Label class="text-muted-foreground">Reparador</Label>
            <p class="font-medium">{{ task.repairer_name }}</p>
          </div>
          <div class="space-y-1">
            <Label class="text-muted-foreground">Fecha de Inicio</Label>
            <p class="font-medium">{{ formatDate(task.start_date) }}</p>
          </div>
          <div class="space-y-1">
            <Label class="text-muted-foreground">Fecha de Finalización</Label>
            <p class="font-medium">{{ formatDate(task.completed_date) }}</p>
          </div>
          <div v-if="task.time_spent_days" class="space-y-1">
            <Label class="text-muted-foreground">Tiempo Total</Label>
            <p class="font-medium">{{ task.time_spent_days }} días</p>
          </div>
        </div>
        <div v-if="task.solution" class="space-y-1">
          <Label class="text-muted-foreground">Solución Aplicada</Label>
          <p class="text-sm">{{ task.solution }}</p>
        </div>
      </div>

      <!-- Cancelada -->
      <div v-else-if="task.status === 'cancelled'" class="text-center py-4">
        <p class="text-muted-foreground">Esta tarea ha sido cancelada</p>
      </div>
    </CardContent>
  </Card>
</template>
