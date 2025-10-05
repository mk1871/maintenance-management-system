<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Accommodations</h1>
      <AccommodationForm @accommodation-created="loadAccommodations" />
    </div>
    
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
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
              <TableRow v-for="accommodation in accommodations" :key="accommodation.id">
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
                    variant="outline" 
                    size="sm" 
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

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'

// Datos de accommodations
const accommodations = ref<Accommodation[]>([])

// Funciones para formatear datos
const formatStatus = (status: string) => {
  const statusNames: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo'
  }
  return statusNames[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'active': 'default',
    'inactive': 'secondary'
  }
  return variants[status] || 'default'
}

// Cargar accommodations
const loadAccommodations = async () => {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (error) {
    console.error('Error al cargar accommodations:', error)
    // Aquí podrías mostrar un toast o mensaje de error
  }
}

// Cargar accommodations cuando se monte el componente
onMounted(async () => {
  await loadAccommodations()
})
</script>