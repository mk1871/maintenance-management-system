<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'

import AccommodationList from '@/components/accommodations/AccommodationList.vue'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'
import AccommodationEditDialog from '@/components/accommodations/AccommodationEditDialog.vue'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationForm } from '@/composables/useAccommodationForm'

// Composables
const route = useRoute()
const router = useRouter()
const { handleApiError } = useAccommodationForm()

// State
const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)
const selectedAccommodation = ref<Accommodation | null>(null)
const showEditDialog = ref(false)

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
  selectedAccommodation.value = accommodation
  showEditDialog.value = true
}

/**
 * Cierra el dialog de edición
 */
const closeEditDialog = (): void => {
  showEditDialog.value = false
  selectedAccommodation.value = null
}

/**
 * Maneja la actualización exitosa de un accommodation
 */
const handleAccommodationUpdated = (): void => {
  closeEditDialog()
  loadAccommodations()
  toast.success('Alojamiento actualizado exitosamente')
}

/**
 * Maneja el refresh de la lista
 */
const handleRefresh = (): void => {
  loadAccommodations()
}

/**
 * Maneja query params para abrir edición desde otras vistas
 */
const handleQueryParams = async (): Promise<void> => {
  const editId = route.query.edit as string

  if (editId) {
    try {
      const accommodation = await accommodationService.getById(editId)
      if (accommodation) {
        handleEdit(accommodation)
        // Limpiar query param
        router.replace({ name: 'Accommodations' })
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error('No se pudo cargar el alojamiento para editar')
    }
  }
}

// Watch route query para detectar edición desde otras vistas
watch(
  () => route.query.edit,
  (editId) => {
    if (editId && accommodations.value.length > 0) {
      handleQueryParams()
    }
  },
)

// Lifecycle
onMounted(async () => {
  await loadAccommodations()
  await handleQueryParams()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header con Título y Estadísticas -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold">Alojamientos</h1>
        <p class="text-muted-foreground">Gestiona todos los alojamientos del sistema</p>
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

    <!-- Dialog de Edición -->
    <AccommodationEditDialog
      v-if="selectedAccommodation"
      :accommodation="selectedAccommodation"
      :open="showEditDialog"
      @updated="handleAccommodationUpdated"
      @update:open="(value) => showEditDialog = value"
    />

  </div>
</template>
