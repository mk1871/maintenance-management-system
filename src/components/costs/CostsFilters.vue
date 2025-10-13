<script lang="ts" setup>
import { ref } from 'vue'
import { CalendarIcon, Filter, X } from 'lucide-vue-next'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Accommodation } from '@/composables/accommodationService'

defineProps<{
  accommodations: Accommodation[]
  startDate?: DateValue
  endDate?: DateValue
  accommodationId: string
  category: string
  minAmount: string
}>()

const emit = defineEmits<{
  (e: 'update:start-date', value: DateValue | undefined): void
  (e: 'update:end-date', value: DateValue | undefined): void
  (e: 'update:accommodation-id', value: string): void
  (e: 'update:category', value: string): void
  (e: 'update:min-amount', value: string | number): void
  (e: 'clear'): void
}>()

const TIME_ZONE = getLocalTimeZone()
const dateFormatter = new DateFormatter('es-ES', { dateStyle: 'medium' })

const isStartDateOpen = ref(false)
const isEndDateOpen = ref(false)

const handleStartDateUpdate = (value: DateValue | undefined): void => {
  emit('update:start-date', value)
  isStartDateOpen.value = false
}

const handleEndDateUpdate = (value: DateValue | undefined): void => {
  emit('update:end-date', value)
  isEndDateOpen.value = false
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Filter class="h-5 w-5" />
          <CardTitle>Filtros</CardTitle>
        </div>
        <Button size="sm" variant="ghost" @click="emit('clear')">
          <X class="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </div>
      <CardDescription>Filtra los costos según tus criterios</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Fecha inicio -->
        <div class="space-y-2">
          <Label for="start-date">Fecha Inicio</Label>
          <Popover v-model:open="isStartDateOpen">
            <PopoverTrigger as-child>
              <Button
                id="start-date"
                :class="
                  cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground',
                  )
                "
                type="button"
                variant="outline"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ startDate ? dateFormatter.format(startDate.toDate(TIME_ZONE)) : 'Seleccionar' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-auto p-0">
              <Calendar
                :locale="'es'"
                :model-value="startDate"
                initial-focus
                @update:model-value="handleStartDateUpdate"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Fecha fin -->
        <div class="space-y-2">
          <Label for="end-date">Fecha Fin</Label>
          <Popover v-model:open="isEndDateOpen">
            <PopoverTrigger as-child>
              <Button
                id="end-date"
                :class="
                  cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground',
                  )
                "
                type="button"
                variant="outline"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ endDate ? dateFormatter.format(endDate.toDate(TIME_ZONE)) : 'Seleccionar' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-auto p-0">
              <Calendar
                :locale="'es'"
                :model-value="endDate"
                initial-focus
                @update:model-value="handleEndDateUpdate"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Alojamiento -->
        <div class="space-y-2">
          <Label for="accommodation">Alojamiento</Label>
          <Select
            id="accommodation"
            :model-value="accommodationId"
            @update:model-value="(val) => val && emit('update:accommodation-id', String(val))"
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                {{ acc.code }} - {{ acc.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Categoría -->
        <div class="space-y-2">
          <Label for="category">Categoría</Label>
          <Select
            id="category"
            :model-value="category"
            @update:model-value="(val) => val && emit('update:category', String(val))"
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="materials">Materiales</SelectItem>
              <SelectItem value="labor">Mano de Obra</SelectItem>
              <SelectItem value="tools">Herramientas</SelectItem>
              <SelectItem value="transport">Transporte</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Monto mínimo -->
        <div class="space-y-2">
          <Label for="min-amount">Monto Mínimo (€)</Label>
          <Input
            id="min-amount"
            :model-value="minAmount"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
            @update:model-value="(val: string | number) => emit('update:min-amount', val)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
