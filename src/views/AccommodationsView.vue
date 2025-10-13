<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CheckCircle, XCircle } from 'lucide-vue-next'

import AccommodationsHeader from '@/components/accommodations/AccommodationsHeader.vue'
import AccommodationList from '@/components/accommodations/AccommodationList.vue'
import AccommodationEditDialog from '@/components/accommodations/AccommodationEditDialog.vue'

import { useAccommodationsStore } from '@/stores/accommodations'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'

const route = useRoute()
const router = useRouter()
const accommodationsStore = useAccommodationsStore()

const selectedAccommodation = ref<Accommodation | null>(null)
const showEditDialog = ref(false)
const isRefreshing = ref(false)

/**
 * Estadísticas computadas desde el store
 */
const stats = computed(() => ({
  total: accommodationsStore.accommodationCount,
  active: accommodationsStore.activeAccommodations.length,
  inactive:
    accommodationsStore.accommodationCount - accommodationsStore.activeAccommodations.length,
}))

/**
 * Maneja la creación exitosa de un accommodation
 */
const handleAccommodationCreated = (): void => {
  toast.success('Alojamiento creado exitosamente')
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
}

/**
 * Maneja el refresh de la lista
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  try {
    await accommodationsStore.fetchAccommodations()
    toast.success('Datos actualizados')
  } catch (error: unknown) {
    console.error('Error al actualizar:', error)
    toast.error('Error al actualizar los datos')
  } finally {
    isRefreshing.value = false
  }
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
    if (editId && accommodationsStore.accommodations.length > 0) {
      handleQueryParams()
    }
  },
)

onMounted(async () => {
  await accommodationsStore.fetchAccommodations()
  await handleQueryParams()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header con botones integrados -->
    <AccommodationsHeader
      :is-refreshing="isRefreshing"
      @refresh="handleRefresh"
      @accommodation-created="handleAccommodationCreated"
    />

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

    <!-- Lista sin toolbar redundante -->
    <AccommodationList
      :accommodations="accommodationsStore.accommodations"
      :is-loading="accommodationsStore.isLoading"
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
