<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CheckCircle, XCircle } from 'lucide-vue-next'

import AccommodationList from '@/components/accommodations/AccommodationList.vue'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'
import AccommodationEditDialog from '@/components/accommodations/AccommodationEditDialog.vue'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationForm } from '@/composables/useAccommodationForm'

const route = useRoute()
const router = useRouter()
const { handleApiError } = useAccommodationForm()

const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)
const selectedAccommodation = ref<Accommodation | null>(null)
const showEditDialog = ref(false)

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
  stats.value.active = accommodations.value.filter((acc) => acc.status === 'active').length
  stats.value.inactive = accommodations.value.filter((acc) => acc.status === 'inactive').length
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
        router.replace({ name: 'Accommodations' })
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error('No se pudo cargar el alojamiento para editar')
    }
  }
}

watch(
  () => route.query.edit,
  (editId) => {
    if (editId && accommodations.value.length > 0) {
      handleQueryParams()
    }
  },
)

onMounted(async () => {
  await loadAccommodations()
  await handleQueryParams()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Alojamientos</h1>
      <p class="text-muted-foreground">Gestiona todos los alojamientos del sistema</p>
    </div>

    <!-- Estadísticas con Card oficial -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total</p>
            <p class="text-3xl font-bold">{{ stats.total }}</p>
          </div>
          <Building2 class="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Activos</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ stats.active }}</p>
          </div>
          <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Inactivos</p>
            <p class="text-3xl font-bold text-muted-foreground">{{ stats.inactive }}</p>
          </div>
          <XCircle class="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>

    <Separator />

    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Lista de Alojamientos</h2>
      <AccommodationForm @accommodation-created="handleAccommodationCreated" />
    </div>

    <!-- Lista -->
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
      @update:open="(value) => (showEditDialog = value)"
    />
  </div>
</template>
