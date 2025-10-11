<script lang="ts" setup>
import { useRouter } from 'vue-router'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, Trash2 } from 'lucide-vue-next'

import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  tasks: TaskWithRelations[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'complete', taskId: string): void
  (e: 'delete', taskId: string): void
}>()

const router = useRouter()

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
    pending: 'secondary', // Gris
    in_progress: 'default', // Azul del tema
    completed: 'outline', // Verde - usando outline + clase semantic
    cancelled: 'destructive', // Rojo
  }
  return variants[status] ?? 'secondary'
}

/**
 * Obtiene clases adicionales para el badge de estado
 */
const getStatusClasses = (status: string): string => {
  if (status === 'completed') {
    // Clase que usa variables CSS del tema
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

const isOverdue = (task: TaskWithRelations): boolean => {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return false
  }
  return new Date(task.due_date) < new Date()
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

const handleRowClick = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

const canComplete = (task: TaskWithRelations): boolean => {
  return task.status !== 'completed' && task.status !== 'cancelled'
}

const getAreaLabel = (task: TaskWithRelations): string => {
  return task.area_label || 'N/A'
}

const getElementName = (task: TaskWithRelations): string => {
  return task.element_name || 'N/A'
}

const getAccommodationCode = (task: TaskWithRelations): string => {
  return task.accommodation?.code || 'N/A'
}
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Alojamiento</TableHead>
          <TableHead>Área/Elemento</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead class="w-[70px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading">
          <TableRow v-for="i in 5" :key="`skeleton-${i}`">
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
            <TableCell><Skeleton class="h-4 w-32" /></TableCell>
            <TableCell><Skeleton class="h-5 w-16" /></TableCell>
            <TableCell><Skeleton class="h-5 w-20" /></TableCell>
            <TableCell><Skeleton class="h-4 w-24" /></TableCell>
            <TableCell><Skeleton class="h-8 w-8" /></TableCell>
          </TableRow>
        </template>

        <TableRow v-else-if="tasks.length === 0">
          <TableCell class="h-24 text-center text-muted-foreground" colspan="7">
            No hay tareas disponibles
          </TableCell>
        </TableRow>

        <template v-else>
          <TableRow
            v-for="task in tasks"
            :key="task.id"
            class="cursor-pointer hover:bg-muted/50"
            @click="handleRowClick(task.id)"
          >
            <TableCell class="font-medium max-w-[300px]">
              <div class="flex items-center gap-2">
                <span>{{ truncateText(task.description, 50) }}</span>
                <Badge v-if="isOverdue(task)" class="text-xs" variant="destructive">
                  Vencida
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <span class="font-mono text-sm">
                {{ getAccommodationCode(task) }}
              </span>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              <div class="flex flex-col">
                <span>{{ getAreaLabel(task) }}</span>
                <span class="text-xs">{{ getElementName(task) }}</span>
              </div>
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
            <TableCell :class="{ 'text-destructive font-semibold': isOverdue(task) }">
              {{ formatDate(task.due_date) }}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child @click.stop="">
                  <Button class="h-8 w-8" size="icon" variant="ghost">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="canComplete(task)"
                    @click.stop="emit('complete', task.id)"
                  >
                    <CheckCircle class="mr-2 h-4 w-4" />
                    Marcar completada
                  </DropdownMenuItem>
                  <DropdownMenuSeparator v-if="canComplete(task)" />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click.stop="emit('delete', task.id)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
