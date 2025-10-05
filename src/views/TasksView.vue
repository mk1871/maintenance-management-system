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
              <TableRow class="hover:bg-muted/50">
                <TableCell>ABC1 - Apartamento Central</TableCell>
                <TableCell>Baño Principal</TableCell>
                <TableCell>Fuga de agua en cañería</TableCell>
                <TableCell>
                  <Badge variant="destructive">Alta</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">En Progreso</Badge>
                </TableCell>
                <TableCell>15/10/2025</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" @click="$router.push('/tasks/1')">Ver</Button>
                </TableCell>
              </TableRow>
              <TableRow class="hover:bg-muted/50">
                <TableCell>XYZ2 - Loft Moderno</TableCell>
                <TableCell>Cocina</TableCell>
                <TableCell>Refrigerador no enfría adecuadamente</TableCell>
                <TableCell>
                  <Badge variant="default">Media</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Pendiente</Badge>
                </TableCell>
                <TableCell>20/10/2025</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" @click="$router.push('/tasks/2')">Ver</Button>
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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TaskForm from '@/components/tasks/TaskForm.vue'
</script>