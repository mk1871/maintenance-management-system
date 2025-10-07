<script setup lang="ts">
import { ref } from 'vue'
import { 
  RangeCalendarRoot,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarGrid,
  RangeCalendarGridHead,
  RangeCalendarGridBody,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarNext,
  RangeCalendarPrev,
  type RangeCalendarRootProps
} from 'reka-ui'

// Importar tipos de fecha de @internationalized/date 
import { 
  today, 
  getLocalTimeZone, 
  type DateValue,
  type CalendarDate 
} from '@internationalized/date'

// Importar iconos de lucide-vue-next (que ya tienes instalado)
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'

// Tipo para el rango de fechas
interface DateRange {
  start: DateValue | undefined
  end: DateValue | undefined
}

// Estado reactivo para el rango de fechas seleccionado
const selectedRange = ref<DateRange>({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()).add({ days: 7 })
})

// Props opcionales para el componente
const props = withDefaults(defineProps<{
  locale?: string
  numberOfMonths?: number
  placeholder?: string
}>(), {
  locale: 'es',
  numberOfMonths: 1,
  placeholder: 'Selecciona un rango de fechas...'
})

// Emits para comunicar cambios al componente padre
const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
  'change': [value: DateRange]
}>()

// Función que se ejecuta cuando cambia la selección
const handleSelectionChange = (value: DateRange) => {
  selectedRange.value = value
  emit('update:modelValue', value)
  emit('change', value)
}

// Formatear fechas para mostrar
const formatDate = (date: DateValue | undefined): string => {
  if (!date) return 'No seleccionada'
  return date.toString()
}
</script>

<template>
  <div class="space-y-4">
    <div class="p-4 bg-muted/20 rounded-lg">
      <h3 class="text-lg font-semibold mb-2">Ejemplo de RangeCalendarRoot de reka-ui</h3>
      <p class="text-sm text-muted-foreground">
        {{ placeholder }}
      </p>
    </div>

    <!-- RangeCalendar usando reka-ui -->
    <RangeCalendarRoot
      v-model="selectedRange"
      :locale="locale"
      :number-of-months="numberOfMonths"
      :weekdayFormat="'short'"
      :fixed-weeks="true"
      class="rounded-md border border-border bg-background p-4"
      @update:model-value="handleSelectionChange"
    >
      <!-- Header con navegación -->
      <RangeCalendarHeader class="flex items-center justify-between mb-4">
        <RangeCalendarPrev
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
        >
          <ChevronLeftIcon class="h-4 w-4" />
        </RangeCalendarPrev>

        <RangeCalendarHeading class="text-sm font-medium" />

        <RangeCalendarNext
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
        >
          <ChevronRightIcon class="h-4 w-4" />
        </RangeCalendarNext>
      </RangeCalendarHeader>

      <!-- Grid del calendario -->
      <RangeCalendarGrid class="w-full border-collapse space-y-1">
        <!-- Header con días de la semana -->
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="flex">
            <RangeCalendarHeadCell
              v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
              :key="day"
              class="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex items-center justify-center"
            >
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>

        <!-- Body del calendario -->
        <RangeCalendarGridBody>
          <RangeCalendarGridRow 
            v-for="(week, weekIndex) in 6" 
            :key="weekIndex"
            class="flex w-full"
          >
            <RangeCalendarCell 
              v-for="(day, dayIndex) in 7"
              :key="`${weekIndex}-${dayIndex}`"
              class="relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
            >
              <RangeCalendarCellTrigger
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 font-normal aria-selected:opacity-100 data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[in-range]:bg-accent data-[in-range]:text-accent-foreground [&[data-today]]:bg-accent [&[data-today]]:text-accent-foreground data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:bg-accent/50 [&[data-outside-month][data-selected]]:text-muted-foreground [&[data-outside-month][data-selected]]:opacity-30"
              />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </RangeCalendarRoot>

    <!-- Información del rango seleccionado -->
    <div class="space-y-2 p-4 bg-muted/10 rounded-lg">
      <h4 class="text-sm font-medium">Rango seleccionado:</h4>
      <div class="text-sm space-y-1">
        <p><span class="font-medium">Fecha inicio:</span> {{ formatDate(selectedRange.start) }}</p>
        <p><span class="font-medium">Fecha fin:</span> {{ formatDate(selectedRange.end) }}</p>
      </div>
      <div v-if="selectedRange.start && selectedRange.end" class="text-xs text-muted-foreground">
        Días seleccionados: {{ 
          selectedRange.end.compare(selectedRange.start) + 1 
        }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales si necesitas personalizar más */
.calendar-day-selected {
  @apply bg-primary text-primary-foreground;
}

.calendar-day-in-range {
  @apply bg-accent text-accent-foreground;
}
</style>