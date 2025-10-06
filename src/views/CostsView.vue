<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

// Simulación de datos
const accommodations = ref([
  { id: '1', code: 'ABC1', name: 'Apartamento Central' },
  { id: '2', code: 'XYZ2', name: 'Loft Moderno' }
])

// Simulación de costos
const costs = ref([
  {
    id: '1',
    task_id: '1234',
    accommodation_id: '1',
    amount: 15.50,
    category: 'materials',
    description: 'Tubo de reparación',
    provider: 'Ferretería López',
    expense_date: new Date('2025-10-06'),
  },
  {
    id: '2',
    task_id: '1235',
    accommodation_id: '2',
    amount: 120.00,
    category: 'labor',
    description: 'Servicio técnico',
    provider: 'Juan Pérez Reparaciones',
    expense_date: new Date('2025-10-07'),
  },
  {
    id: '3',
    task_id: '1236',
    accommodation_id: '1',
    amount: 45.75,
    category: 'materials',
    description: 'Pintura para habitación',
    provider: 'Color Express',
    expense_date: new Date('2025-09-20'),
  }
])

// Filtros
const filters = ref({
  startDate: '',
  endDate: '',
  accommodationId: 'all',
  category: 'all',
  minAmount: ''
})

// Funciones de filtrado
const filteredCosts = computed(() => {
  let result = [...costs.value]
  
  // Filtrar por fecha
  if (filters.value.startDate) {
    const startDate = new Date(filters.value.startDate)
    result = result.filter(cost => new Date(cost.expense_date) >= startDate)
  }
  
  if (filters.value.endDate) {
    const endDate = new Date(filters.value.endDate)
    endDate.setHours(23, 59, 59, 999) // Hasta el final del día
    result = result.filter(cost => new Date(cost.expense_date) <= endDate)
  }
  
  // Filtrar por accommodation
  if (filters.value.accommodationId !== 'all') {
    result = result.filter(cost => cost.accommodation_id === filters.value.accommodationId)
  }
  
  // Filtrar por categoría
  if (filters.value.category !== 'all') {
    result = result.filter(cost => cost.category === filters.value.category)
  }
  
  // Filtrar por monto mínimo
  if (filters.value.minAmount) {
    const min = parseFloat(filters.value.minAmount)
    result = result.filter(cost => cost.amount >= min)
  }
  
  return result
})

// Funciones para calcular resúmenes
const totalCosts = computed(() => {
  return costs.value.reduce((sum, cost) => sum + cost.amount, 0)
})

const monthlyCosts = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  return costs.value
    .filter(cost => {
      const costDate = new Date(cost.expense_date)
      return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

const annualCosts = computed(() => {
  const currentYear = new Date().getFullYear()
  
  return costs.value
    .filter(cost => {
      const costDate = new Date(cost.expense_date)
      return costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

const averagePerTask = computed(() => {
  if (costs.value.length === 0) return 0
  return totalCosts.value / new Set(costs.value.map(c => c.task_id)).size
})

// Funciones auxiliares
const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('es-ES').format(new Date(date))
}

const getAccommodationCode = (accommodationId: string) => {
  const accommodation = accommodations.value.find(acc => acc.id === accommodationId)
  return accommodation ? accommodation.code : 'N/A'
}

const formatCostCategory = (category: string) => {
  const categoryNames: Record<string, string> = {
    'materials': 'Materiales',
    'labor': 'Mano de Obra',
    'tools': 'Herramientas',
    'transport': 'Transporte',
    'other': 'Otros'
  }
  return categoryNames[category] || category
}

const calculateFilteredTotal = () => {
  return filteredCosts.value.reduce((sum, cost) => sum + cost.amount, 0)
}

// Funciones de acción
const applyFilters = () => {
  console.log('Filtros aplicados:', filters.value)
  // En una implementación real, se haría una llamada a la API con los filtros
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    accommodationId: 'all',
    category: 'all',
    minAmount: ''
  }
}

const exportToExcel = () => {
  console.log('Exportando a Excel')
  // En una implementación real, se usaría una librería como xlsx para exportar
}

const exportToPDF = () => {
  console.log('Exportando a PDF')
  // En una implementación real, se usaría una librería como jsPDF o similar
}
</script>

<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Costos</h1>
      <div class="flex space-x-4">
        <Button variant="outline" @click="exportToExcel">
          Exportar a Excel
        </Button>
        <Button @click="exportToPDF">
          Exportar a PDF
        </Button>
      </div>
    </div>
    
    <!-- Filtros -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label for="date-range">Rango de Fechas</Label>
            <div class="flex space-x-2">
              <Input 
                id="start-date" 
                v-model="filters.startDate" 
                type="date" 
              />
              <span class="self-center">a</span>
              <Input 
                id="end-date" 
                v-model="filters.endDate" 
                type="date" 
              />
            </div>
          </div>
          
          <div>
            <Label for="accommodation">Accommodation</Label>
            <Select v-model="filters.accommodationId">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem 
                  v-for="acc in accommodations" 
                  :key="acc.id" 
                  :value="acc.id"
                >
                  {{ acc.code }} - {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label for="category">Categoría</Label>
            <Select v-model="filters.category">
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="materials">Materiales</SelectItem>
                <SelectItem value="labor">Mano de Obra</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label for="minAmount">Monto Mínimo</Label>
            <Input 
              id="minAmount" 
              v-model="filters.minAmount" 
              type="number" 
              placeholder="Mínimo" 
            />
          </div>
        </div>
        
        <div class="flex justify-end mt-4">
          <Button @click="applyFilters" variant="default">
            Aplicar Filtros
          </Button>
          <Button @click="clearFilters" variant="outline" class="ml-2">
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <!-- Tarjetas resumen -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent class="p-6">
          <p class="text-sm text-muted-foreground">Costo Total</p>
          <p class="text-2xl font-bold">€{{ totalCosts.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6">
          <p class="text-sm text-muted-foreground">Este Mes</p>
          <p class="text-2xl font-bold">€{{ monthlyCosts.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6">
          <p class="text-sm text-muted-foreground">Este Año</p>
          <p class="text-2xl font-bold">€{{ annualCosts.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6">
          <p class="text-sm text-muted-foreground">Promedio por Reparación</p>
          <p class="text-2xl font-bold">€{{ averagePerTask.toFixed(2) }}</p>
        </CardContent>
      </Card>
      </div>
    
    <!-- Tabla de costos -->
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Accommodation</TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cost in filteredCosts" :key="cost.id">
                <TableCell>{{ formatDate(cost.expense_date) }}</TableCell>
                <TableCell>{{ getAccommodationCode(cost.accommodation_id) }}</TableCell>
                <TableCell>
                  <RouterLink 
                    :to="`/tasks/${cost.task_id}`" 
                    class="text-primary hover:underline"
                  >
                    #{{ cost.task_id }}
                  </RouterLink>
                </TableCell>
                <TableCell>{{ formatCostCategory(cost.category) }}</TableCell>
                <TableCell>{{ cost.description || 'N/A' }}</TableCell>
                <TableCell>€{{ cost.amount.toFixed(2) }}</TableCell>
                <TableCell>{{ cost.provider || 'N/A' }}</TableCell>
                <TableCell>
                  <div class="flex space-x-2">
                    <Button size="sm" variant="outline">Editar</Button>
                    <Button size="sm" variant="outline">Eliminar</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colspan="5" class="text-right font-bold">Total:</TableCell>
                <TableCell>€{{ calculateFilteredTotal().toFixed(2) }}</TableCell>
                <TableCell colspan="2"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
