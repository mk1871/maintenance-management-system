<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:status', value: string): void
  (e: 'update:priority', value: string): void
  (e: 'clear'): void
}>()

const searchQuery = ref('')
const selectedStatus = ref<string>('all')
const selectedPriority = ref<string>('all')

/**
 * Observa cambios en selectedStatus y emite
 */
watch(selectedStatus, (newValue) => {
  emit('update:status', newValue)
})

/**
 * Observa cambios en selectedPriority y emite
 */
watch(selectedPriority, (newValue) => {
  emit('update:priority', newValue)
})

/**
 * Emite actualización de búsqueda
 */
const handleSearchInput = (event: Event): void => {
  const input = event.target as HTMLInputElement
  searchQuery.value = input.value
  emit('update:search', input.value)
}

/**
 * Limpia todos los filtros
 */
const clearFilters = (): void => {
  searchQuery.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  emit('clear')
}

/**
 * Verifica si hay filtros activos
 */
const hasActiveFilters = (): boolean => {
  return (
    searchQuery.value !== '' ||
    selectedStatus.value !== 'all' ||
    selectedPriority.value !== 'all'
  )
}
</script>

<template>
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
      <!-- Búsqueda -->
      <div class="relative w-full md:w-[300px]">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          :value="searchQuery"
          class="pl-8"
          placeholder="Buscar tareas..."
          @input="handleSearchInput"
        />
      </div>

      <!-- Estado -->
      <Select v-model="selectedStatus">
        <SelectTrigger class="w-full md:w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="in_progress">En Progreso</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      <!-- Prioridad -->
      <Select v-model="selectedPriority">
        <SelectTrigger class="w-full md:w-[180px]">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las prioridades</SelectItem>
          <SelectItem value="low">Baja</SelectItem>
          <SelectItem value="medium">Media</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Limpiar Filtros -->
    <Button
      v-if="hasActiveFilters()"
      size="sm"
      variant="outline"
      @click="clearFilters"
    >
      <X class="mr-2 h-4 w-4" />
      Limpiar filtros
    </Button>
  </div>
</template>
