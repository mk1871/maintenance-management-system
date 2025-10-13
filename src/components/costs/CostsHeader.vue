<script lang="ts" setup>
import { RefreshCw, FileSpreadsheet, FileText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps<{
  isRefreshing: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'export-csv'): void
  (e: 'export-pdf'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Costos</h1>
      <p class="text-muted-foreground mt-1">Gestiona y analiza todos los costos de mantenimiento</p>
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

      <Button variant="outline" @click="emit('export-csv')">
        <FileSpreadsheet class="h-4 w-4 mr-2" />
        CSV
      </Button>

      <Button variant="outline" @click="emit('export-pdf')">
        <FileText class="h-4 w-4 mr-2" />
        PDF
      </Button>
    </div>
  </div>
</template>
