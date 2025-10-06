<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/components/ui/sonner'
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
import { taskService, type Task } from '@/composables/taskService'
import { costService, type CreateCostData } from '@/composables/costService'

// Variables
const route = useRoute()
const router = useRouter()

const taskId = ref(route.params.id as string)
const task = ref<Task | null>(null)
const costs = ref<any[]>([])
const loading = ref(true)
const repairerName = ref('')
const newComment = ref('')
const showCostForm = ref(false)
const newCost = ref<CreateCostData>({
  task_id: taskId.value,
  amount: 0,
  category: 'materials',
  description: '',
  accommodation_id: '' // Este valor se debe obtener del task
})
const costError = ref('')
const beforePhotos = ref<any[]>([])
const duringPhotos = ref<any[]>([])
const afterPhotos = ref<any[]>([])

// Cargar la tarea y costos
const loadTaskData = async () => {
  try {
    loading.value = true
    const taskData = await taskService.getById(taskId.value)
    if (!taskData) {
      toast.error('La tarea no fue encontrada')
      return
    }
    
    task.value = taskData
    newCost.value.accommodation_id = taskData.accommodation_id
    
    // Cargar costos de esta tarea
    costs.value = await costService.getByTaskId(taskId.value)
  } catch (error) {
    console.error('Error al cargar los datos de la tarea:', error)
    toast.error('Error al cargar los datos de la tarea')
  } finally {
    loading.value = false
  }
}

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

const formatDate = (date: string | null) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('es-ES').format(new Date(date))
}

// Funciones de negocio
const calculateTotalCosts = () => {
  return costs.value.reduce((sum, cost) => sum + cost.amount, 0)
}

const startRepair = async () => {
  if (!repairerName.value.trim()) {
    toast.error('Por favor ingrese el nombre del reparador')
    return
  }
  
  try {
    // Actualizar el estado de la tarea a "in_progress"
    await taskService.update({
      id: taskId.value,
      status: 'in_progress',
      repairer_name: repairerName.value,
      start_date: new Date().toISOString()
    })
    
    // Actualizar la tarea en la vista
    await loadTaskData()
    
    toast.success('Tarea iniciada exitosamente')
  } catch (error) {
    console.error('Error al iniciar la tarea:', error)
    toast.error('Error al iniciar la tarea')
  }
}

const completeTask = async () => {
  // Aquí podría mostrar un modal para ingresar la solución
  try {
    await taskService.update({
      id: taskId.value,
      status: 'completed',
      completed_date: new Date().toISOString(),
      solution: 'Reparación completada'
    })
    
    // Actualizar la tarea en la vista
    await loadTaskData()
    
    toast.success('Tarea completada exitosamente')
  } catch (error) {
    console.error('Error al completar la tarea:', error)
    toast.error('Error al completar la tarea')
  }
}

const addComment = () => {
  if (!newComment.value.trim()) {
    toast.error('El comentario no puede estar vacío')
    return
  }
  
  // Aquí iría la lógica para guardar comentarios, que no está implementada completamente
  // ya que la tabla comments no tiene CRUD completo en los servicios
  console.log('Agregar comentario:', newComment.value)
  toast.info('Funcionalidad de comentarios aún no implementada')
  newComment.value = ''
}

const saveCost = async () => {
  // Validar los datos
  if (!newCost.value.amount || newCost.value.amount <= 0) {
    costError.value = 'El importe debe ser mayor a 0'
    return
  }
  
  try {
    // Crear el nuevo costo
    const createdCost = await costService.create({
      ...newCost.value,
      task_id: taskId.value,
      accommodation_id: task.value?.accommodation_id || '',
      amount: newCost.value.amount,
      category: newCost.value.category,
      description: newCost.value.description
    })
    
    // Actualizar la lista de costos
    costs.value = [createdCost, ...costs.value]
    
    // Resetear el formulario
    newCost.value = {
      task_id: taskId.value,
      amount: 0,
      category: 'materials',
      description: '',
      accommodation_id: task.value?.accommodation_id || ''
    }
    
    // Cerrar el diálogo
    showCostForm.value = false
    
    toast.success('Costo registrado exitosamente')
  } catch (error) {
    console.error('Error al guardar el costo:', error)
    toast.error('Error al registrar el costo')
  }
}

const duplicateTask = () => {
  console.log('Duplicar tarea')
  // Aquí iría la lógica para duplicar la tarea
  toast.info('Funcionalidad de duplicar tarea aún no implementada')
}

const goBack = () => {
  router.push('/tasks')
}

onMounted(async () => {
  await loadTaskData()
})
</script>

<template>
  <div class="container mx-auto py-6">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    <div v-else-if="!task" class="text-center py-12">
      <h2 class="text-2xl font-bold text-foreground">Tarea no encontrada</h2>
      <Button class="mt-4" @click="goBack">Volver a tareas</Button>
    </div>
    <div v-else class="space-y-6">
      <div class="flex items-center mb-6">
        <Button variant="outline" class="mr-4" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Button>
        <h1 class="text-3xl font-bold text-foreground">Tarea #{{ task.id.substring(0, 8) }}</h1>
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
              <div v-if="costs && costs.length > 0">
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
                    <TableRow v-for="cost in costs" :key="cost.id">
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
                :class="{ 'border-destructive': costError }"
              />
              <div v-if="costError" class="col-span-4 text-sm text-destructive text-right"> {{ costError }}</div>
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
  </div>
</template>
