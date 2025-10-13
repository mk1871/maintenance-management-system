<script lang="ts" setup>
import { computed } from 'vue'
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps<{
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  estimatedCost: string
  repairerName: string
  isDatePickerOpen: boolean
  errors: {
    description: string
    due_date: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:description', value: string): void
  (e: 'update:priority', value: 'low' | 'medium' | 'high'): void
  (e: 'update:dueDate', value: string): void
  (e: 'update:estimatedCost', value: string): void
  (e: 'update:repairerName', value: string): void
  (e: 'update:isDatePickerOpen', value: boolean): void
}>()

const TIME_ZONE = getLocalTimeZone()
const df = new DateFormatter('es-ES', { dateStyle: 'long' })

const dueDateValue = computed(() => {
  try {
    return props.dueDate ? parseDate(props.dueDate) : undefined
  } catch {
    return undefined
  }
})

const formattedDueDate = computed(() => {
  if (!dueDateValue.value) return 'Selecciona una fecha'
  return df.format(dueDateValue.value.toDate(TIME_ZONE))
})

const handleDateSelect = (value: DateValue | undefined): void => {
  if (value) {
    emit('update:dueDate', value.toString())
    emit('update:isDatePickerOpen', false)
  }
}

const handleDescriptionChange = (value: unknown): void => {
  if (typeof value === 'string') {
    emit('update:description', value)
  }
}

const handlePriorityChange = (value: unknown): void => {
  if (value === 'low' || value === 'medium' || value === 'high') {
    emit('update:priority', value)
  }
}

const handleEstimatedCostChange = (value: unknown): void => {
  if (typeof value === 'string') {
    emit('update:estimatedCost', value)
  }
}

const handleRepairerNameChange = (value: unknown): void => {
  if (typeof value === 'string') {
    emit('update:repairerName', value)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Descripción -->
    <div class="space-y-2">
      <Label for="description">Descripción del Problema *</Label>
      <Textarea
        id="description"
        :class="{ 'border-destructive': errors.description }"
        :model-value="description"
        placeholder="Describe detalladamente el problema..."
        rows="4"
        @update:model-value="handleDescriptionChange"
      />
      <p v-if="errors.description" class="text-sm font-medium text-destructive">
        {{ errors.description }}
      </p>
      <p class="text-xs text-muted-foreground">{{ description.length }} / 500 caracteres</p>
    </div>

    <!-- Prioridad y Fecha -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Prioridad -->
      <div class="space-y-2">
        <Label>Prioridad *</Label>
        <Select :model-value="priority" @update:model-value="handlePriorityChange">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Fecha de Vencimiento -->
      <div class="space-y-2">
        <Label>Fecha de Vencimiento *</Label>
        <Popover :open="isDatePickerOpen" @update:open="emit('update:isDatePickerOpen', $event)">
          <PopoverTrigger as-child>
            <Button
              :class="
                cn(
                  'w-full justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground',
                  errors.due_date && 'border-destructive',
                )
              "
              variant="outline"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ formattedDueDate }}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-auto p-0">
            <Calendar
              :locale="'es'"
              :min-value="today(TIME_ZONE)"
              :model-value="dueDateValue"
              initial-focus
              @update:model-value="handleDateSelect"
            />
          </PopoverContent>
        </Popover>
        <p v-if="errors.due_date" class="text-sm font-medium text-destructive">
          {{ errors.due_date }}
        </p>
      </div>
    </div>

    <!-- Costo y Reparador -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Costo Estimado -->
      <div class="space-y-2">
        <Label for="estimated_cost">Costo Estimado (€)</Label>
        <Input
          id="estimated_cost"
          :model-value="estimatedCost"
          min="0"
          placeholder="0.00"
          step="0.01"
          type="number"
          @update:model-value="handleEstimatedCostChange"
        />
      </div>

      <!-- Reparador -->
      <div class="space-y-2">
        <Label for="repairer_name">Reparador Asignado</Label>
        <Input
          id="repairer_name"
          :model-value="repairerName"
          placeholder="Nombre del reparador (opcional)"
          @update:model-value="handleRepairerNameChange"
        />
      </div>
    </div>
  </div>
</template>
