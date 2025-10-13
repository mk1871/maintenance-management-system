<script lang="ts" setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-vue-next'
import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  tasks: TaskWithRelations[]
}>()

const emit = defineEmits<{
  (e: 'view-task', taskId: string): void
  (e: 'view-all'): void
}>()

const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

const getStatusVariant = (status: string): 'default' | 'outline' | 'secondary' | 'destructive' => {
  const variants: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
  }
  return variants[status] ?? 'secondary'
}

const getStatusClasses = (status: string): string => {
  if (status === 'completed') {
    return 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
  }
  return ''
}

const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return translations[priority] ?? priority
}

const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return translations[status] ?? status
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
  <Card>
    <CardHeader>
      <CardTitle>Tareas Recientes</CardTitle>
      <CardDescription>Últimas tareas del sistema</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="tasks.length === 0" class="text-center py-8 text-muted-foreground">
        No hay tareas recientes
      </div>
      <div v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alojamiento</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="task in tasks" :key="task.id" class="cursor-pointer hover:bg-muted/50">
              <TableCell class="font-medium">
                {{ task.accommodation?.code }}
              </TableCell>
              <TableCell class="max-w-xs truncate">
                {{ task.description }}
              </TableCell>
              <TableCell>
                <Badge :variant="getPriorityVariant(task.priority)">
                  {{ translatePriority(task.priority) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  :class="getStatusClasses(task.status)"
                  :variant="getStatusVariant(task.status)"
                >
                  {{ translateStatus(task.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                {{ formatDate(task.due_date) }}
              </TableCell>
              <TableCell class="text-right">
                <Button size="sm" variant="ghost" @click="emit('view-task', task.id)">
                  Ver
                  <ArrowRight class="ml-2 h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="mt-4 flex justify-center">
          <Button variant="outline" @click="emit('view-all')">
            Ver todas las tareas
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
