<script lang="ts" setup>
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle2, PlayCircle, AlertCircle } from 'lucide-vue-next'

defineProps<{
  stats: {
    total: number
    pending: number
    inProgress: number
    completed: number
    overdue: number
  }
}>()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-5">
    <!-- Total -->
    <Card>
      <CardContent class="flex items-center justify-between p-6">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Total</p>
          <p class="text-3xl font-bold">{{ stats.total }}</p>
        </div>
        <ClipboardList class="h-8 w-8 text-muted-foreground" />
      </CardContent>
    </Card>

    <!-- Pendientes -->
    <Card>
      <CardContent class="flex items-center justify-between p-6">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Pendientes</p>
          <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ stats.pending }}
          </p>
        </div>
        <Clock class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
      </CardContent>
    </Card>

    <!-- En Progreso -->
    <Card>
      <CardContent class="flex items-center justify-between p-6">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">En Progreso</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ stats.inProgress }}
          </p>
        </div>
        <PlayCircle class="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </CardContent>
    </Card>

    <!-- Completadas -->
    <Card>
      <CardContent class="flex items-center justify-between p-6">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Completadas</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ stats.completed }}
          </p>
        </div>
        <CheckCircle2 class="h-8 w-8 text-green-600 dark:text-green-400" />
      </CardContent>
    </Card>

    <!-- Vencidas -->
    <Card>
      <CardContent class="flex items-center justify-between p-6">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Vencidas</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400">
            {{ stats.overdue }}
          </p>
        </div>
        <AlertCircle class="h-8 w-8 text-red-600 dark:text-red-400" />
      </CardContent>
    </Card>
  </div>
</template>
