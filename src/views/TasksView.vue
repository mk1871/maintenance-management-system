<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Tareas de Mantenimiento</h1>
      <TaskForm />
    </div>
    
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accommodation</TableHead>
                <TableHead>Área/Elemento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="task in tasks" :key="task.id" class="hover:bg-muted/50">
                <TableCell>{{ task.accommodation?.code }} - {{ task.accommodation?.name }}</TableCell>
                <TableCell>{{ formatAreaName(task.area) }} / {{ formatElementName(task.element) }}</TableCell>
                <TableCell>{{ task.description }}</TableCell>
                <TableCell>
                  <Badge :variant="getPriorityVariant(task.priority)">
                    {{ getPriorityEmoji(task.priority) }} {{ formatPriority(task.priority) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(task.status)">
                    {{ formatStatus(task.status) }}
                  </Badge>
                </TableCell>
                <TableCell>{{ formatDate(task.due_date) }}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    @click="$router.push(`/tasks/${task.id}`)"
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
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import TaskForm from '@/components/tasks/TaskForm.vue'
import { taskService, type Task } from '@/composables/taskService'

// Datos de tareas
const tasks = ref<Task[]>([])

// Router para navegación
const router = useRouter()

// Funciones para formatear datos
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

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('es-ES').format(new Date(date))
}

// Cargar tareas cuando se monte el componente
onMounted(async () => {
  try {
    tasks.value = await taskService.getAll()
  } catch (error) {
    console.error('Error al cargar tareas:', error)
    // Aquí podrías mostrar un toast o mensaje de error
  }
})
</script>