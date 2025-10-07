<script lang="ts" setup>
import { ref } from 'vue'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

const value = ref<DateValue>()

const df = new DateFormatter('es-ES', {
  dateStyle: 'long',
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-8">
    <div>
      <h1 class="text-3xl font-bold">Prueba de Calendar shadcn-vue</h1>
      <p class="text-muted-foreground mt-2">
        Vista de prueba para verificar el componente Calendar
      </p>
    </div>

    <Separator />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Card 1: DatePicker con Popover -->
      <Card>
        <CardHeader>
          <CardTitle>DatePicker con Popover</CardTitle>
          <CardDescription>Calendar dentro de un Popover trigger</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Popover>
            <PopoverTrigger as-child>
              <Button
                :class="
                  cn(
                    'w-full justify-start text-left font-normal',
                    !value && 'text-muted-foreground',
                  )
                "
                variant="outline"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ value ? df.format(value.toDate(getLocalTimeZone())) : 'Seleccionar fecha' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-auto p-0">
              <Calendar v-model="value" initial-focus />
            </PopoverContent>
          </Popover>

          <div v-if="value" class="text-sm">
            <p class="font-medium">Fecha seleccionada:</p>
            <p class="text-muted-foreground">{{ value.toString() }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Calendar standalone -->
      <Card>
        <CardHeader>
          <CardTitle>Calendar Standalone</CardTitle>
          <CardDescription>Calendar mostrado directamente sin Popover</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar v-model="value" class="rounded-md border" />
        </CardContent>
      </Card>
    </div>

    <!-- Card 3: Información de debug -->
    <Card>
      <CardHeader>
        <CardTitle>Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <pre class="text-xs bg-muted p-4 rounded-md overflow-auto">{{ {
          value: value?.toString(),
          formatted: value ? df.format(value.toDate(getLocalTimeZone())) : null,
        } }}</pre>
      </CardContent>
    </Card>
  </div>
</template>
