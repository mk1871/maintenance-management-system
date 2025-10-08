<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'

import AccommodationList from '@/components/accommodations/AccommodationList.vue'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationForm } from '@/composables/useAccommodationForm'

// Composables
const { handleApiError } = useAccommodationForm()

// State
const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)

/**
 * Estadísticas calculadas
 */
const stats = ref({
  total: 0,
  active: 0,
  inactive: 0,
})

/**
 * Carga la lista de accommodations
 */
const loadAccommodations = async (): Promise<void> => {
  isLoading.value = true
  try {
    accommodations.value = await accommodationService.getAll()
    calculateStats()
  } catch (error: unknown) {
    handleApiError(error, 'cargar alojamientos')
  } finally {
    isLoading.value = false
  }
}

/**
 * Calcula estadísticas de accommodations
 */
const calculateStats = (): void => {
  stats.value.total = accommodations.value.length
  stats.value.active = countAccommodationsByStatus('active')
  stats.value.inactive = countAccommodationsByStatus('inactive')
}

/**
 * Cuenta accommodations por estado
 */
const countAccommodationsByStatus = (status: string): number => {
  return accommodations.value.filter((acc) => acc.status === status).length
}

/**
 * Maneja la creación exitosa de un accommodation
 */
const handleAccommodationCreated = (): void => {
  loadAccommodations()
}

/**
 * Maneja el evento de edición
 */
const handleEdit = (accommodation: Accommodation): void => {
  toast.info(`Edición de ${accommodation.code} próximamente`)
  // TODO: Implementar AccommodationEditDialog
}

/**
 * Maneja el refresh de la lista
 */
const handleRefresh = (): void => {
  loadAccommodations()
}

// Lifecycle
onMounted(async () => {
  await loadAccommodations()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header con Título y Estadísticas -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold">Alojamientos</h1>
        <p class="text-muted-foreground">
          Gestiona todos los alojamientos del sistema
        </p>
      </div>

      <!-- Estadísticas Compactas -->
      <div class="flex gap-4">
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold">{{ stats.total }}</div>
            <div class="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold text-green-600">{{ stats.active }}</div>
            <div class="text-sm text-muted-foreground">Activos</div>
          </div>
        </div>
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold text-gray-500">{{ stats.inactive }}</div>
            <div class="text-sm text-muted-foreground">Inactivos</div>
          </div>
        </div>
      </div>
    </div>

    <Separator />

    <!-- Toolbar con Botón de Crear -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Lista de Alojamientos</h2>
      <AccommodationForm @accommodation-created="handleAccommodationCreated" />
    </div>

    <!-- Lista de Accommodations -->
    <AccommodationList
      :accommodations="accommodations"
      :is-loading="isLoading"
      @edit="handleEdit"
      @refresh="handleRefresh"
    />
  </div>
</template>
