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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MoreHorizontal, Edit, Trash2, Building2 } from 'lucide-vue-next'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useAccommodationForm } from '@/composables/useAccommodationForm'

const props = defineProps<{
  accommodations: Accommodation[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'edit', accommodation: Accommodation): void
}>()

const router = useRouter()
const { handleApiError } = useAccommodationForm()

const searchQuery = ref('')
const accommodationToDelete = ref<Accommodation | null>(null)
const isDeleting = ref(false)

const filteredAccommodations = computed((): Accommodation[] => {
  if (!searchQuery.value.trim()) {
    return props.accommodations
  }

  const query = searchQuery.value.toLowerCase().trim()

  return props.accommodations.filter((accommodation) => {
    const searchableFields = [
      accommodation.code.toLowerCase(),
      accommodation.name.toLowerCase(),
      accommodation.address?.toLowerCase() || '',
    ]

    return searchableFields.some((field) => field.includes(query))
  })
})

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' => {
  return status === 'active' ? 'default' : 'secondary'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
  }
  return labels[status] || status
}

const navigateToDetail = (accommodationId: string): void => {
  router.push({ name: 'AccommodationDetail', params: { id: accommodationId } })
}

const handleRowClick = (accommodationId: string): void => {
  navigateToDetail(accommodationId)
}

const openEditDialog = (accommodation: Accommodation, event: Event): void => {
  event.stopPropagation()
  emit('edit', accommodation)
}

const openDeleteDialog = (accommodation: Accommodation): void => {
  accommodationToDelete.value = accommodation
}

const closeDeleteDialog = (): void => {
  accommodationToDelete.value = null
}

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
    <!-- Buscador con InputGroup (componente oficial shadcn-vue) -->
    <InputGroup class="w-full md:w-[300px]">
      <InputGroupAddon>
        <Search class="h-4 w-4" />
      </InputGroupAddon>
      <InputGroupInput v-model="searchQuery" placeholder="Buscar alojamientos..." />
    </InputGroup>

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
            <TableCell class="h-64" colspan="6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 class="h-12 w-12" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {{ searchQuery ? 'No se encontraron alojamientos' : 'No hay alojamientos' }}
                  </EmptyTitle>
                  <EmptyDescription>
                    {{
                      searchQuery
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Comienza creando tu primer alojamiento'
                    }}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>

          <!-- Data Rows -->
          <TableRow
            v-for="accommodation in filteredAccommodations"
            :key="accommodation.id"
            class="cursor-pointer hover:bg-muted/50 transition-colors"
            @click="handleRowClick(accommodation.id)"
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
                <DropdownMenuTrigger as-child @click.stop>
                  <Button
                    aria-label="Acciones del alojamiento"
                    class="h-8 w-8"
                    size="icon"
                    variant="ghost"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.stop="openEditDialog(accommodation, $event)">
                    <Edit class="mr-2 h-4 w-4" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click.stop="openDeleteDialog(accommodation)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
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
