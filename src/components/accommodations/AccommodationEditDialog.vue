<script lang="ts" setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'

import type { Accommodation } from '@/composables/accommodationService'

// Props
const props = defineProps<{
  accommodation: Accommodation | null
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'updated'): void
}>()

/**
 * Cierra el dialog
 */
const closeDialog = (): void => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="closeDialog">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Editar Alojamiento</DialogTitle>
        <DialogDescription>
          {{ props.accommodation?.code }} - {{ props.accommodation?.name }}
        </DialogDescription>
      </DialogHeader>

      <Alert>
        <Info class="h-4 w-4" />
        <AlertDescription>
          La funcionalidad de edición está en desarrollo. Próximamente podrás modificar:
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>Información básica (nombre, código, dirección)</li>
            <li>Estado del alojamiento</li>
            <li>Áreas configuradas</li>
            <li>Elementos por área</li>
          </ul>
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog"> Cerrar </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
