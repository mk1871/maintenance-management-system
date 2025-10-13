<script lang="ts" setup>
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle2, DollarSign } from 'lucide-vue-next'
import type { TaskWithRelations } from '@/composables/taskService'

const props = defineProps<{
  task: TaskWithRelations
}>()

const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const isOverdue = computed(() => {
  if (props.task.status === 'completed' || props.task.status === 'cancelled') {
    return false
  }
  return new Date(props.task.due_date) < new Date()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Fechas Importantes -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Fechas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1">
          <Label class="text-muted-foreground flex items-center gap-2">
            <Clock class="h-4 w-4" />
            Fecha de Vencimiento
          </Label>
          <div class="flex items-center justify-between">
            <p class="font-medium">{{ formatDate(task.due_date) }}</p>
            <Badge v-if="isOverdue" variant="destructive">Vencida</Badge>
          </div>
        </div>

        <div v-if="task.start_date" class="space-y-1">
          <Label class="text-muted-foreground flex items-center gap-2">
            <Clock class="h-4 w-4" />
            Fecha de Inicio
          </Label>
          <p class="font-medium">{{ formatDate(task.start_date) }}</p>
        </div>

        <div v-if="task.completed_date" class="space-y-1">
          <Label class="text-muted-foreground flex items-center gap-2">
            <CheckCircle2 class="h-4 w-4" />
            Fecha de Finalización
          </Label>
          <p class="font-medium">{{ formatDate(task.completed_date) }}</p>
        </div>

        <div v-if="task.time_spent_days" class="space-y-1">
          <Label class="text-muted-foreground">Tiempo Total</Label>
          <p class="font-medium">{{ task.time_spent_days }} días</p>
        </div>
      </CardContent>
    </Card>

    <!-- Información Adicional -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <DollarSign class="h-5 w-5" />
          Costo Estimado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-1">
          <Label class="text-muted-foreground">Estimación Inicial</Label>
          <p class="text-2xl font-bold">{{ formatCurrency(task.estimated_cost) }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Asignación -->
    <Card v-if="task.repairer_name">
      <CardHeader>
        <CardTitle>Asignado a</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="font-medium">{{ task.repairer_name }}</p>
      </CardContent>
    </Card>
  </div>
</template>
