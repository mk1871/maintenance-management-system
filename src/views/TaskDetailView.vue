<template>
  <div class="container mx-auto py-6">
    <div class="flex items-center mb-6">
      <Button variant="outline" class="mr-4" @click="$router.go(-1)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-foreground">Tarea #1234</h1>
      <div class="ml-auto">
        <Badge :variant="getPriorityVariant(task.priority)" class="ml-4">
          {{ getPriorityEmoji(task.priority) }} {{ formatPriority(task.priority) }}
        </Badge>
        <Badge :variant="getStatusVariant(task.status)" class="ml-2">
          {{ formatStatus(task.status) }}
        </Badge>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Información General -->
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Accommodation</Label>
                <p class="text-foreground">{{ task.accommodation?.code }} - {{ task.accommodation?.name }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Área</Label>
                <p class="text-foreground">{{ formatAreaName(task.area) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Elemento</Label>
                <p class="text-foreground">{{ formatElementName(task.element) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Prioridad</Label>
                <div class="flex items-center">
                  <span class="mr-2">{{ getPriorityEmoji(task.priority) }}</span>
                  <span>{{ formatPriority(task.priority) }}</span>
                </div>
              </div>
              <div class="md:col-span-2">
                <Label class="text-sm font-medium text-muted-foreground">Descripción del problema</Label>
                <p class="text-foreground mt-1">{{ task.description }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Estado de Reparación -->
        <Card v-if="task.status !== 'completed'">
          <CardHeader>
            <CardTitle>Estado de Reparación</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="task.status === 'pending'" class="space-y-4">
              <div class="flex items-center space-x-4">
                <Badge variant="secondary">{{ formatStatus(task.status) }}</Badge>
                <Button @click="startRepair">Comenzar Reparación</Button>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Reparador</Label>
                <Input 
                  v-model="repairerName" 
                  placeholder="Nombre del reparador"
                  class="mt-1"
                />
              </div>
            </div>
            
            <div v-else-if="task.status === 'in_progress'" class="space-y-4">
              <div class="flex items-center space-x-4">
                <Badge variant="default">{{ formatStatus(task.status) }}</Badge>
                <Button @click="completeTask">Completar Tarea</Button>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Reparador</Label>
                <p class="text-foreground">{{ task.repairer_name || 'No asignado' }}</p>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de inicio</Label>
                <p class="text-foreground">{{ formatDate(task.start_date) }}</p>
              </div>
            </div>
            
            <div v-else-if="task.status === 'completed'" class="space-y-4">
              <div class="flex items-center space-x-4">
                <Badge variant="success">{{ formatStatus(task.status) }}</Badge>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Reparador</Label>
                <p class="text-foreground">{{ task.repairer_name || 'No asignado' }}</p>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de inicio</Label>
                <p class="text-foreground">{{ formatDate(task.start_date) }}</p>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de finalización</Label>
                <p class="text-foreground">{{ formatDate(task.completed_date) }}</p>
              </div>
              
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Solución</Label>
                <p class="text-foreground">{{ task.solution }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Costos -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Costos</CardTitle>
            <Button size="sm" @click="showCostForm = true">Agregar Costo</Button>
          </CardHeader>
          <CardContent>
            <div v-if="task.costs && task.costs.length > 0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="cost in task.costs" :key="cost.id">
                    <TableCell>{{ formatCostCategory(cost.category) }}</TableCell>
                    <TableCell>{{ cost.description }}</TableCell>
                    <TableCell>€{{ cost.amount.toFixed(2) }}</TableCell>
                    <TableCell>{{ formatDate(cost.expense_date) }}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div class="mt-4 text-right font-bold">
                Total: €{{ calculateTotalCosts().toFixed(2) }}
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted-foreground">
              No hay costos registrados
            </div>
          </CardContent>
        </Card>
        
        <!-- Galería de Fotos -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Galería de Fotos</CardTitle>
            <Button size="sm">Subir Fotos</Button>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <!-- Fotos 'Before' -->
              <div>
                <h4 class="font-medium mb-3">Antes</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div v-for="photo in beforePhotos" :key="photo.id" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <img :src="photo.url" :alt="photo.description" class="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div v-if="beforePhotos.length === 0" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <span class="text-muted-foreground">Sin fotos</span>
                  </div>
                </div>
              </div>
              
              <!-- Fotos 'During' -->
              <div>
                <h4 class="font-medium mb-3">Durante</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div v-for="photo in duringPhotos" :key="photo.id" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <img :src="photo.url" :alt="photo.description" class="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div v-if="duringPhotos.length === 0" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <span class="text-muted-foreground">Sin fotos</span>
                  </div>
                </div>
              </div>
              
              <!-- Fotos 'After' -->
              <div>
                <h4 class="font-medium mb-3">Después</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div v-for="photo in afterPhotos" :key="photo.id" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <img :src="photo.url" :alt="photo.description" class="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div v-if="afterPhotos.length === 0" class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <span class="text-muted-foreground">Sin fotos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Comentarios -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle>Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="comment in task.comments" :key="comment.id" class="border-b pb-4 last:border-0 last:pb-0">
                <div class="flex justify-between">
                  <span class="font-medium">{{ comment.author }}</span>
                  <span class="text-sm text-muted-foreground">{{ formatDate(comment.date) }}</span>
                </div>
                <p class="mt-1">{{ comment.text }}</p>
              </div>
              
              <div class="pt-4">
                <Textarea 
                  v-model="newComment" 
                  placeholder="Agregue un comentario..."
                  class="mb-2"
                />
                <Button @click="addComment">Agregar Comentario</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div class="space-y-6">
        <!-- Detalles -->
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Detección</Label>
                <p class="text-foreground">{{ formatDate(task.detection_date) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</Label>
                <p class="text-foreground">{{ formatDate(task.due_date) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                <p class="text-foreground">{{ formatDate(task.created_at) }}</p>
              </div>
              <div v-if="task.completed_date">
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Finalización</Label>
                <p class="text-foreground">{{ formatDate(task.completed_date) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Etiquetas</Label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <Badge 
                    v-for="tag in task.tags" 
                    :key="tag.id" 
                    variant="outline"
                  >
                    {{ tag.name }}
                  </Badge>
                  <span v-if="!task.tags || task.tags.length === 0" class="text-muted-foreground text-sm">Sin etiquetas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Acciones -->
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <Button class="w-full" @click="duplicateTask" variant="outline">
                Duplicar Tarea
              </Button>
              <Button class="w-full" variant="outline">
                Exportar a PDF
              </Button>
              <Button class="w-full" variant="destructive">
                Eliminar Tarea
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    
    <!-- Formulario para registrar costos -->
    <Dialog v-model:open="showCostForm">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Costo</DialogTitle>
          <DialogDescription>
            Agregue un nuevo costo a esta tarea
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="amount" class="text-right">Importe (€)</Label>
            <Input 
              id="amount" 
              v-model="newCost.amount" 
              type="number" 
              step="0.01" 
              class="col-span-3" 
            />
          </div>
          
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="category" class="text-right">Categoría</Label>
            <Select v-model="newCost.category">
              <SelectTrigger class="col-span-3">
                <SelectValue placeholder="Seleccione una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materials">Materiales</SelectItem>
                <SelectItem value="labor">Mano de Obra</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="description" class="text-right">Descripción</Label>
            <Textarea 
              id="description" 
              v-model="newCost.description" 
              class="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button @click="saveCost">Guardar Costo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

// Simulación de datos de tarea
const task = ref({
  id: '1234',
  accommodation: { code: 'ABC1', name: 'Apartamento Central' },
  area: 'bathroom_1',
  element: 'pipe',
  description: 'Fuga de agua en cañería principal del baño. Se requiere reparación inmediata para evitar daños mayores.',
  priority: 'high',
  status: 'pending',
  detection_date: new Date('2025-10-05'),
  due_date: new Date('2025-10-15'),
  created_at: new Date('2025-10-05'),
  completed_date: null,
  start_date: null,
  repairer_name: null,
  solution: null,
  tags: [
    { id: '1', name: 'fontanería' },
    { id: '2', name: 'urgente' }
  ],
  costs: [
    { id: '1', category: 'materials', amount: 15.50, description: 'Tubo de reparación', expense_date: new Date('2025-10-06') }
  ],
  comments: [
    { id: '1', author: 'Supervisor', text: 'Detectado durante revisión rutinaria', date: new Date('2025-10-05') }
  ]
})

const router = useRouter()

// Datos para reparación
const repairerName = ref('')

// Datos para comentarios
const newComment = ref('')

// Datos para costos
const showCostForm = ref(false)
const newCost = ref({
  amount: 0,
  category: 'materials',
  description: ''
})

// Fotos (simuladas)
const beforePhotos = ref([
  { id: '1', url: '', description: 'Foto antes de la reparación' }
])
const duringPhotos = ref([])
const afterPhotos = ref([])

// Funciones para formatear datos
const formatAreaName = (area: string) => {
  const areaNames: Record<string, string> = {
    'living_room': 'Sala de Estar',
    'kitchen': 'Cocina',
    'bathroom_1': 'Baño Principal',
    'bathroom_2': 'Segundo Baño',
    'bedroom_1': 'Dormitorio Principal',
    'bedroom_2': 'Segundo Dormitorio',
    'bedroom_3': 'Tercer Dormitorio',
    'terrace': 'Terraza',
    'garage': 'Garaje'
  }
  return areaNames[area] || area
}

const formatElementName = (element: string) => {
  const elementNames: Record<string, string> = {
    'pipe': 'Cañería',
    'toilet': 'Inodoro',
    'sink': 'Fregadero',
    'shower': 'Ducha',
    'refrigerator': 'Refrigerador',
    'stove': 'Estufa'
  }
  return elementNames[element] || element
}

const formatPriority = (priority: string) => {
  const priorityNames: Record<string, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta'
  }
  return priorityNames[priority] || priority
}

const getPriorityEmoji = (priority: string) => {
  const priorityEmojis: Record<string, string> = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🔴'
  }
  return priorityEmojis[priority] || ''
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, any> = {
    'low': 'secondary',
    'medium': 'default',
    'high': 'destructive'
  }
  return variants[priority] || 'default'
}

const formatStatus = (status: string) => {
  const statusNames: Record<string, string> = {
    'pending': 'Pendiente',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada'
  }
  return statusNames[status] || status
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    'pending': 'secondary',
    'in_progress': 'default',
    'completed': 'success',
    'cancelled': 'destructive'
  }
  return variants[status] || 'default'
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

const formatDate = (date: Date | string | null) => {
  if (!date) return 'N/A'
  if (typeof date === 'string') date = new Date(date)
  return new Intl.DateTimeFormat('es-ES').format(date)
}

// Funciones de negocio
const calculateTotalCosts = () => {
  return task.value.costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0
}

const startRepair = () => {
  if (!repairerName.value) {
    // Aquí podrías mostrar un mensaje de error
    return
  }
  
  // Actualizar estado de la tarea
  task.value.status = 'in_progress'
  task.value.repairer_name = repairerName.value
  task.value.start_date = new Date()
  
  // Aquí iría la lógica para guardar en la base de datos
  console.log('Tarea iniciada:', task.value)
}

const completeTask = () => {
  // Aquí podría mostrar un modal para ingresar la solución
  task.value.status = 'completed'
  task.value.completed_date = new Date()
  task.value.solution = 'Reparación completada exitosamente'
  
  // Aquí iría la lógica para guardar en la base de datos
  console.log('Tarea completada:', task.value)
}

const addComment = () => {
  if (!newComment.value.trim()) return
  
  const comment = {
    id: (task.value.comments.length + 1).toString(),
    author: 'Usuario Actual', // En una implementación real, esto vendría del store de autenticación
    text: newComment.value,
    date: new Date()
  }
  
  task.value.comments.push(comment)
  newComment.value = ''
  
  // Aquí iría la lógica para guardar en la base de datos
  console.log('Comentario agregado:', comment)
}

const saveCost = () => {
  if (!newCost.value.amount || newCost.value.amount <= 0) return
  
  const cost = {
    id: (task.value.costs?.length || 0 + 1).toString(),
    ...newCost.value,
    expense_date: new Date()
  }
  
  if (!task.value.costs) {
    task.value.costs = []
  }
  
  task.value.costs.push(cost)
  newCost.value = { amount: 0, category: 'materials', description: '' }
  showCostForm.value = false
  
  // Aquí iría la lógica para guardar en la base de datos
  console.log('Costo agregado:', cost)
}

const duplicateTask = () => {
  console.log('Duplicar tarea')
  // Aquí iría la lógica para duplicar la tarea
}
</script>