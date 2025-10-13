<script lang="ts" setup>
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import AccommodationFormDialog from '@/components/accommodations/AccommodationFormDialog.vue'

defineProps<{
  isRefreshing: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'accommodation-created'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Alojamientos</h1>
      <p class="text-muted-foreground">Gestiona todos los alojamientos del sistema</p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        :disabled="isRefreshing"
        aria-label="Actualizar datos"
        size="icon"
        variant="outline"
        @click="emit('refresh')"
      >
        <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
      </Button>

      <AccommodationFormDialog @accommodation-created="emit('accommodation-created')" />
    </div>
  </div>
</template>
