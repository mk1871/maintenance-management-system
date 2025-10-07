<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const formData = ref({
  due_date: undefined as unknown,
})

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})

onMounted(() => {
  const tomorrow = today(getLocalTimeZone()).add({ days: 1 })
  formData.value.due_date = tomorrow
})
</script>

<template>
  <div class="container mx-auto py-8">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test: Calendar dentro de Card (sin Dialog)</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="text-sm font-medium">Fecha de Vencimiento</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                :class="
                  cn(
                    'w-full justify-start text-left font-normal mt-2',
                    !formData.due_date && 'text-muted-foreground',
                  )
                "
                variant="outline"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  formData.due_date
                    ? df.format((formData.due_date as DateValue).toDate(getLocalTimeZone()))
                    : 'Seleccionar fecha'
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-auto p-0">
              <Calendar
                :model-value="formData.due_date as DateValue"
                initial-focus
                @update:model-value="(val) => { formData.due_date = val }"
              />
            </PopoverContent>
          </Popover>
        </div>

        <p class="text-sm text-muted-foreground">
          Este calendar NO está dentro de un Dialog
        </p>
      </CardContent>
    </Card>
  </div>
</template>
