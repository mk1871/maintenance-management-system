<script lang="ts" setup>
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { TaskWithRelations } from '@/composables/taskService'

defineProps<{
  task: TaskWithRelations
}>()
</script>

<template>
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
</template>
