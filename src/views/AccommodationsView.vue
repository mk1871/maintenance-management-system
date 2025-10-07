<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Search, RefreshCw, Building2 } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'

import { type Accommodation, accommodationService } from '@/composables/accommodationService'

const router = useRouter()

// Estado de datos
const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)

// Estado de filtros
const searchQuery = ref('')
const statusFilter = ref<string>('all')

/**
 * Carga inicial de datos desde la base de datos
 */
const loadData = async (): Promise<void> => {
  try {
    isLoading.value = true
    accommodations.value = await accommodationService.getAll()
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar los alojamientos')
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresca los datos desde la base de datos
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await loadData()
  isRefreshing.value = false
  toast.success('Alojamientos actualizados')
}

/**
 * Limpia todos los filtros aplicados
 */
const clearFilters = (): void => {
  searchQuery.value = ''
  statusFilter.value = 'all'
}

/**
 * Filtra alojamientos según criterios seleccionados
 */
const filteredAccommodations = computed(() => {
  let result = [...accommodations.value]

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (acc) =>
        acc.code.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query) ||
        acc.address?.toLowerCase().includes(query),
    )
  }

  // Filtro por estado
  if (statusFilter.value !== 'all') {
    result = result.filter((acc) => acc.status === statusFilter.value)
  }

  return result
})

/**
 * Formatea el estado para mostrar
 */
const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
  }
  return statuses[status] || status
}

/**
 * Retorna la variante de badge según estado
 */
const getStatusVariant = (status: string): 'default' | 'secondary' => {
  const variants: Record<string, 'default' | 'secondary'> = {
    active: 'default',
    inactive: 'secondary',
  }
  return variants[status] ?? 'secondary'
}

/**
 * Cuenta las áreas configuradas de un alojamiento
 */
const countConfiguredAreas = (accommodation: Accommodation): number => {
  return accommodation.configured_areas ? Object.keys(accommodation.configured_areas).length : 0
}

/**
 * Navega al detalle del alojamiento
 */
const viewAccommodationDetail = (accommodationId: string): void => {
  router.push(`/accommodations/${accommodationId}`)
}

/**
 * Maneja la creación exitosa de un alojamiento
 */
const handleAccommodationCreated = (): void => {
  handleRefresh()
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Alojamientos</h1>
        <p class="text-muted-foreground mt-1">
          Gestiona todos los alojamientos del sistema
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button :disabled="isRefreshing" size="icon" variant="outline" @click="handleRefresh">
          <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
        </Button>
        <AccommodationForm @accommodation-created="handleAccommodationCreated" />
      </div>
    </div>

    <!-- Filtros -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Search class="h-5 w-5" />
          Búsqueda y Filtros
        </CardTitle>
        <CardDescription>Busca alojamientos por código, nombre o dirección</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Búsqueda -->
          <div class="relative">
            <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" class="pl-9" placeholder="Buscar alojamientos..." />
          </div>

          <!-- Filtro por Estado -->
          <Select v-model="statusFilter">
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Botón limpiar filtros -->
        <div class="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" @click="clearFilters"> Limpiar filtros </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de Alojamientos -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Lista de Alojamientos</CardTitle>
            <CardDescription>
              {{ filteredAccommodations.length }} alojamiento(s) encontrado(s)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-3">
          <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredAccommodations.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <Building2 class="h-16 w-16 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold">No hay alojamientos</h3>
          <p class="text-muted-foreground mt-1">
            {{
              accommodations.length === 0
                ? 'Crea tu primer alojamiento para comenzar'
                : 'No se encontraron alojamientos con los filtros aplicados'
            }}
          </p>
          <Button
            v-if="accommodations.length > 0"
            class="mt-4"
            variant="outline"
            @click="clearFilters"
          >
            Limpiar filtros
          </Button>
        </div>

        <!-- Tabla -->
        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Áreas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="accommodation in filteredAccommodations"
                :key="accommodation.id"
                class="hover:bg-muted/50 cursor-pointer"
                @click="viewAccommodationDetail(accommodation.id)"
              >
                <TableCell class="font-medium">
                  <div class="flex items-center gap-2">
                    <Building2 class="h-4 w-4 text-muted-foreground" />
                    <span class="font-semibold">{{ accommodation.code }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {{ accommodation.name }}
                </TableCell>
                <TableCell>
                  <span class="text-muted-foreground">
                    {{ accommodation.address || 'Sin dirección' }}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {{ countConfiguredAreas(accommodation) }} áreas
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(accommodation.status)">
                    {{ formatStatus(accommodation.status) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    @click.stop="viewAccommodationDetail(accommodation.id)"
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
