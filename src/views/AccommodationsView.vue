<script lang="ts" setup>
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { useDataLoader } from '@/composables/useDataLoader'
import { Spinner } from '@/components/ui/spinner'

const { data: accommodations, isLoading, load } = useDataLoader<Accommodation>()

const formatStatus = (status: string) =>
  ({
    active: 'Activo',
    inactive: 'Inactivo',
  })[status] ?? status

const getStatusVariant = (status: string): 'default' | 'secondary' => {
  const variants: Record<string, 'default' | 'secondary'> = {
    active: 'default',
    inactive: 'secondary',
  }
  return variants[status] ?? 'default'
}

load(accommodationService.getAll)
</script>

<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Accommodations</h1>
      <AccommodationForm @accommodation-created="() => load(accommodationService.getAll)" />
    </div>

    <Card>
      <CardContent class="p-0">
        <div v-if="isLoading" class="h-64 flex items-center justify-center">
          <Spinner class="h-12 w-12" />
        </div>
        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tareas Pendientes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="accommodation in accommodations || []" :key="accommodation.id">
                <TableCell>{{ accommodation.code }}</TableCell>
                <TableCell>{{ accommodation.name }}</TableCell>
                <TableCell>{{ accommodation.address || 'N/A' }}</TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(accommodation.status)">
                    {{ formatStatus(accommodation.status) }}
                  </Badge>
                </TableCell>
                <TableCell>0</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    @click="$router.push(`/accommodations/${accommodation.id}`)"
                  >
                    Ver
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
