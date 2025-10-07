<script lang="ts" setup>
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  modelValue?: DateValue
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar fecha',
  disabled: false,
  error: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: DateValue | undefined]
}>()

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  return df.format(props.modelValue.toDate(getLocalTimeZone()))
})

const handleSelect = (value: DateValue | undefined) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground',
            error && 'border-destructive',
          )
        "
        :disabled="disabled"
        variant="outline"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ displayValue }}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-auto p-0">
      <Calendar :model-value="modelValue" initial-focus @update:model-value="handleSelect" />
    </PopoverContent>
  </Popover>
</template>
