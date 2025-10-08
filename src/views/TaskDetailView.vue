<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { taskService, type TaskWithRelations } from '@/composables/taskService'
import { costService, type CreateCostData, type Cost } from '@/composables/costService'

const route = useRoute()
const router = useRouter()

// Estado de datos
const taskId = route.params.id as string
const task = ref<TaskWithRelations | null>(null)
const costs = ref<Cost[]>([])
const isLoading = ref(true)

// Estado del formulario de reparación
const repairerName = ref('')

// Estado del formulario de costos
const showCostDialog = ref(false)
const isSavingCost = ref(false)
const newCost = ref<CreateCostData>({
  task_id: taskId,
  amount: 0,
  category: 'materials',
  description: '',
  accommodation_id: '',
})
const costErrors = ref({
  amount: '',
  description: '',
})

/**
 * Carga los datos de la tarea y sus costos
 */
const loadTaskData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const [taskData, costsData] = await Promise.all([
      taskService.getById(taskId),
      costService.getByTaskId(taskId),
    ])

    if (!taskData) {
      toast.error('Tarea no encontrada')
      router.push('/tasks')
      return
    }

    task.value = taskData
    costs.value = costsData || []
    newCost.value.accommodation_id = taskData.accommodation_id
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar los datos de la tarea')
  } finally {
    isLoading.value = false
  }
}

/**
 * Calcula el costo total de la tarea
 */
const totalCost = computed(() => {
  return costs.value.reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Formatea la prioridad
 */
const formatPriority = (priority: string): string => {
  const priorities: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return priorities[priority] || priority
}

/**
 * Variante de badge para prioridad
 */
const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

/**
 * Formatea el estado
 */
const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return statuses[status] || status
}

/**
 * Variante de badge para estado
 */
const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'outline',
    in_progress: 'default',
    completed: 'secondary',
    cancelled: 'outline',
  }
  return variants[status] ?? 'default'
}

/**
 * Formatea la categoría del costo
 */
const formatCostCategory = (category: string): string => {
  const categories: Record<string, string> = {
    materials: 'Materiales',
    labor: 'Mano de Obra',
    tools: 'Herramientas',
    transport: 'Transporte',
    other: 'Otros',
  }
  return categories[category] || category
}

/**
 * Formatea fecha
 */
const formatDate = (date: string | undefined): string => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Inicia la reparación de la tarea
 */
const startRepair = async (): Promise<void> => {
  if (!repairerName.value.trim()) {
    toast.error('Ingrese el nombre del reparador')
    return
  }

  try {
    await taskService.update({
      id: taskId,
      status: 'in_progress',
      repairer_name: repairerName.value,
      start_date: new Date().toISOString(),
    })

    await loadTaskData()
    toast.success('Reparación iniciada exitosamente')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al iniciar la reparación')
  }
}

/**
 * Completa la tarea
 */
const completeTask = async (): Promise<void> => {
  try {
    await taskService.update({
      id: taskId,
      status: 'completed',
      completed_date: new Date().toISOString(),
      solution: 'Reparación completada',
    })

    await loadTaskData()
    toast.success('Tarea completada exitosamente')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al completar la tarea')
  }
}

/**
 * Valida el formulario de costos
 */
const validateCostForm = (): boolean => {
  costErrors.value = { amount: '', description: '' }
  let isValid = true

  if (!newCost.value.amount || newCost.value.amount <= 0) {
    costErrors.value.amount = 'El importe debe ser mayor a 0'
    isValid = false
  }

  if (!newCost.value.description?.trim()) {
    costErrors.value.description = 'La descripción es requerida'
    isValid = false
  }

  return isValid
}

/**
 * Guarda un nuevo costo
 */
const saveCost = async (): Promise<void> => {
  if (!validateCostForm()) return

  try {
    isSavingCost.value = true
    const createdCost = await costService.create({
      ...newCost.value,
      task_id: taskId,
      accommodation_id: task.value?.accommodation_id || '',
    })

    costs.value = [createdCost, ...costs.value]

    // Reset form
    newCost.value = {
      task_id: taskId,
      amount: 0,
      category: 'materials',
      description: '',
      accommodation_id: task.value?.accommodation_id || '',
    }
    costErrors.value = { amount: '', description: '' }

    showCostDialog.value = false
    toast.success('Costo registrado exitosamente')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al registrar el costo')
  } finally {
    isSavingCost.value = false
  }
}

/**
 * Abre el dialog para agregar un costo
 */
const openCostDialog = (): void => {
  newCost.value = {
    task_id: taskId,
    amount: 0,
    category: 'materials',
    description: '',
    accommodation_id: task.value?.accommodation_id || '',
  }
  costErrors.value = { amount: '', description: '' }
  showCostDialog.value = true
}

/**
 * Navega de vuelta a la lista de tareas
 */
const goBack = (): void => {
  router.push('/tasks')
}

onMounted(async () => {
  await loadTaskData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton class="h-12 w-full" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Skeleton class="h-64 w-full" />
          <Skeleton class="h-64 w-full" />
        </div>
        <div class="space-y-6">
          <Skeleton class="h-48 w-full" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!task" class="flex flex-col items-center justify-center py-12">
      <AlertCircle class="h-16 w-16 text-muted-foreground mb-4" />
      <h2 class="text-2xl font-bold">Tarea no encontrada</h2>
      <Button class="mt-4" @click="goBack">Volver a tareas</Button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button size="icon" variant="outline" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Tarea #{{ task.id.substring(0, 8) }}</h1>
            <p class="text-muted-foreground mt-1">
              {{ task.accommodation?.code }} - {{ task.accommodation?.name }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge :variant="getPriorityVariant(task.priority)">
            {{ formatPriority(task.priority) }}
          </Badge>
          <Badge :variant="getStatusVariant(task.status)">
            {{ formatStatus(task.status) }}
          </Badge>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Información General -->
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <Label class="text-muted-foreground">Área</Label>
                  <p class="font-medium">{{ task.area_label || 'N/A' }}</p>
                </div>
                <div class="space-y-1">
                  <Label class="text-muted-foreground">Elemento</Label>
                  <p class="font-medium">{{ task.element_name || 'N/A' }}</p>
                </div>
              </div>
              <Separator />
              <div class="space-y-1">
                <Label class="text-muted-foreground">Descripción del Problema</Label>
                <p class="text-sm">{{ task.description }}</p>
              </div>
              <div v-if="task.notes" class="space-y-1">
                <Label class="text-muted-foreground">Notas</Label>
                <p class="text-sm">{{ task.notes }}</p>
              </div>
            </CardContent>
          </Card>

          <!-- Estado de Reparación -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Estado de Reparación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <!-- Pendiente -->
              <div v-if="task.status === 'pending'" class="space-y-4">
                <div class="space-y-2">
                  <Label>Reparador</Label>
                  <Input v-model="repairerName" placeholder="Nombre del reparador" />
                </div>
                <Button @click="startRepair">Comenzar Reparación</Button>
              </div>

              <!-- En Progreso -->
              <div v-else-if="task.status === 'in_progress'" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <Label class="text-muted-foreground">Fecha de Inicio</Label>
                    <p class="font-medium">{{ formatDate(task.start_date) }}</p>
                  </div>
                </div>
                <Button @click="completeTask">
                  <CheckCircle2 class="h-4 w-4 mr-2" />
                  Completar Tarea
                </Button>
              </div>

              <!-- Completada -->
              <div v-else-if="task.status === 'completed'" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <Label class="text-muted-foreground">Fecha de Inicio</Label>
                    <p class="font-medium">{{ formatDate(task.start_date) }}</p>
                  </div>
                  <div class="space-y-1">
                    <Label class="text-muted-foreground">Fecha de Finalización</Label>
                    <p class="font-medium">{{ formatDate(task.completed_date) }}</p>
                  </div>
                  <div v-if="task.time_spent_days" class="space-y-1">
                    <Label class="text-muted-foreground">Días Transcurridos</Label>
                    <p class="font-medium">{{ task.time_spent_days }} días</p>
                  </div>
                </div>
                <Separator />
                <div class="space-y-1">
                  <Label class="text-muted-foreground">Solución</Label>
                  <p class="text-sm">{{ task.solution || 'Sin solución registrada' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Costos -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <DollarSign class="h-5 w-5" />
                  Costos
                </CardTitle>
                <CardDescription>Total: €{{ totalCost.toFixed(2) }}</CardDescription>
              </div>
              <Button size="sm" @click="openCostDialog">Agregar Costo</Button>
            </CardHeader>
            <CardContent>
              <div v-if="costs.length > 0" class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead class="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="cost in costs" :key="cost.id">
                      <TableCell>{{ formatCostCategory(cost.category) }}</TableCell>
                      <TableCell>{{ cost.description }}</TableCell>
                      <TableCell class="text-right font-medium">
                        €{{ cost.amount.toFixed(2) }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                No hay costos registrados
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Detalles -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-1">
                <Label class="text-muted-foreground">Creación</Label>
                <p class="text-sm font-medium">{{ formatDate(task.created_at) }}</p>
              </div>
              <div class="space-y-1">
                <Label class="text-muted-foreground">Detección</Label>
                <p class="text-sm font-medium">{{ formatDate(task.detection_date) }}</p>
              </div>
              <div class="space-y-1">
                <Label class="text-muted-foreground">Vencimiento</Label>
                <p class="text-sm font-medium">{{ formatDate(task.due_date) }}</p>
              </div>
              <div v-if="task.start_date" class="space-y-1">
                <Label class="text-muted-foreground">Inicio</Label>
                <p class="text-sm font-medium">{{ formatDate(task.start_date) }}</p>
              </div>
              <div v-if="task.completed_date" class="space-y-1">
                <Label class="text-muted-foreground">Finalización</Label>
                <p class="text-sm font-medium">{{ formatDate(task.completed_date) }}</p>
              </div>
            </CardContent>
          </Card>

          <!-- Acciones -->
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <Button class="w-full" variant="outline">Exportar a PDF</Button>
              <Button class="w-full" variant="destructive">Eliminar Tarea</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Dialog para Agregar Costo -->
      <Dialog v-model:open="showCostDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Costo</DialogTitle>
            <DialogDescription>Agregue un nuevo costo a esta tarea</DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>Importe (€) *</Label>
              <Input
                v-model.number="newCost.amount"
                :class="{ 'border-destructive': costErrors.amount }"
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
              <p v-if="costErrors.amount" class="text-sm font-medium text-destructive">
                {{ costErrors.amount }}
              </p>
            </div>

            <div class="space-y-2">
              <Label>Categoría *</Label>
              <Select v-model="newCost.category">
                <SelectTrigger>
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

            <div class="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                v-model="newCost.description"
                :class="{ 'border-destructive': costErrors.description }"
                placeholder="Describe el costo..."
                rows="3"
              />
              <p v-if="costErrors.description" class="text-sm font-medium text-destructive">
                {{ costErrors.description }}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showCostDialog = false">Cancelar</Button>
            <Button :disabled="isSavingCost" @click="saveCost">
              {{ isSavingCost ? 'Guardando...' : 'Guardar Costo' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
