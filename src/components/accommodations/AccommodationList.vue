<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Search, Eye, Trash2 } from 'lucide-vue-next'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationForm } from '@/composables/useAccommodationForm'

// Props
const props = defineProps<{
  accommodations: Accommodation[]
  isLoading: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'edit', accommodation: Accommodation): void
}>()

// Composables
const router = useRouter()
const { handleApiError } = useAccommodationForm()

// State
const searchQuery = ref('')
const accommodationToDelete = ref<Accommodation | null>(null)
const isDeleting = ref(false)

/**
 * Accommodations filtrados por búsqueda
 */
const filteredAccommodations = computed((): Accommodation[] => {
  return filterAccommodationsBySearch()
})

/**
 * Filtra accommodations por consulta de búsqueda
 */
const filterAccommodationsBySearch = (): Accommodation[] => {
  if (!searchQuery.value.trim()) {
    return props.accommodations
  }

  const query = normalizeSearchQuery(searchQuery.value)

  return props.accommodations.filter((accommodation) => matchesSearchQuery(accommodation, query))
}

/**
 * Normaliza la consulta de búsqueda
 */
const normalizeSearchQuery = (query: string): string => {
  return query.toLowerCase().trim()
}

/**
 * Verifica si un accommodation coincide con la búsqueda
 */
const matchesSearchQuery = (accommodation: Accommodation, query: string): boolean => {
  const searchableFields = [
    accommodation.code.toLowerCase(),
    accommodation.name.toLowerCase(),
    accommodation.address?.toLowerCase() || '',
  ]

  return searchableFields.some((field) => field.includes(query))
}

/**
 * Obtiene la variante del badge según el estado
 */
const getStatusBadgeVariant = (status: string): 'default' | 'secondary' => {
  return status === 'active' ? 'default' : 'secondary'
}

/**
 * Obtiene el label del estado
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
  }
  return labels[status] || status
}

/**
 * Navega al detalle de un accommodation
 */
const navigateToDetail = (accommodationId: string): void => {
  router.push({ name: 'AccommodationDetail', params: { id: accommodationId } })
}

/**
 * Abre el dialog de edición
 */
const openEditDialog = (accommodation: Accommodation): void => {
  emit('edit', accommodation)
}

/**
 * Abre el dialog de confirmación de eliminación
 */
const openDeleteDialog = (accommodation: Accommodation): void => {
  accommodationToDelete.value = accommodation
}

/**
 * Cierra el dialog de eliminación
 */
const closeDeleteDialog = (): void => {
  accommodationToDelete.value = null
}

/**
 * Elimina un accommodation después de confirmación
 */
const handleDeleteAccommodation = async (): Promise<void> => {
  if (!accommodationToDelete.value) return

  isDeleting.value = true
  try {
    await accommodationService.delete(accommodationToDelete.value.id)

    toast.success('Alojamiento eliminado exitosamente')
    closeDeleteDialog()
    emit('refresh')
  } catch (error: unknown) {
    handleApiError(error, 'eliminar alojamiento')
  } finally {
    isDeleting.value = false
  }
}

/**
 * Formatea una fecha para mostrar
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Buscador -->
    <div class="relative w-full md:w-[300px]">
      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input v-model="searchQuery" class="pl-8" placeholder="Buscar alojamientos..." />
    </div>

    <!-- Loading State con Skeletons -->
    <div v-if="isLoading" class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead class="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="i in 5" :key="`skeleton-${i}`">
            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
            <TableCell><Skeleton class="h-4 w-32" /></TableCell>
            <TableCell><Skeleton class="h-4 w-40" /></TableCell>
            <TableCell><Skeleton class="h-5 w-16" /></TableCell>
            <TableCell><Skeleton class="h-4 w-24" /></TableCell>
            <TableCell><Skeleton class="h-8 w-8" /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Tabla de Accommodations -->
    <div v-else class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead class="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Empty State -->
          <TableRow v-if="filteredAccommodations.length === 0">
            <TableCell class="h-24 text-center text-muted-foreground" colspan="6">
              {{ searchQuery ? 'No se encontraron alojamientos' : 'No hay alojamientos creados' }}
            </TableCell>
          </TableRow>

          <!-- Data Rows -->
          <TableRow
            v-for="accommodation in filteredAccommodations"
            :key="accommodation.id"
            class="hover:bg-muted/50"
          >
            <TableCell class="font-medium">
              {{ accommodation.code }}
            </TableCell>
            <TableCell>{{ accommodation.name }}</TableCell>
            <TableCell class="text-muted-foreground">
              {{ accommodation.address || 'Sin dirección' }}
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusBadgeVariant(accommodation.status)">
                {{ getStatusLabel(accommodation.status) }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ formatDate(accommodation.created_at) }}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button class="h-8 w-8" size="icon" variant="ghost">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="navigateToDetail(accommodation.id)">
                    <Eye class="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEditDialog(accommodation)">
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="openDeleteDialog(accommodation)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="!!accommodationToDelete" @update:open="closeDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar alojamiento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el alojamiento
            <strong>{{ accommodationToDelete?.code }}</strong>
            y todas sus configuraciones. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="closeDeleteDialog"> Cancelar </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDeleteAccommodation"
          >
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
