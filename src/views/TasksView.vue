<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Tareas de Mantenimiento</h1>
      <Button>
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nueva Tarea
      </Button>
    </div>
    
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b">
              <tr>
                <th class="text-left py-3 px-4">Accommodation</th>
                <th class="text-left py-3 px-4">Área/Elemento</th>
                <th class="text-left py-3 px-4">Descripción</th>
                <th class="text-left py-3 px-4">Prioridad</th>
                <th class="text-left py-3 px-4">Estado</th>
                <th class="text-left py-3 px-4">Vencimiento</th>
                <th class="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b hover:bg-muted/50">
                <td class="py-3 px-4">ABC1 - Apartamento Central</td>
                <td class="py-3 px-4">Baño Principal</td>
                <td class="py-3 px-4">Fuga de agua en cañería</td>
                <td class="py-3 px-4">
                  <Badge variant="destructive">Alta</Badge>
                </td>
                <td class="py-3 px-4">
                  <Badge variant="default">En Progreso</Badge>
                </td>
                <td class="py-3 px-4">15/10/2025</td>
                <td class="py-3 px-4">
                  <Button variant="outline" size="sm">Ver</Button>
                </td>
              </tr>
              <tr class="border-b hover:bg-muted/50">
                <td class="py-3 px-4">XYZ2 - Loft Moderno</td>
                <td class="py-3 px-4">Cocina</td>
                <td class="py-3 px-4">Refrigerador no enfría adecuadamente</td>
                <td class="py-3 px-4">
                  <Badge variant="default">Media</Badge>
                </td>
                <td class="py-3 px-4">
                  <Badge variant="secondary">Pendiente</Badge>
                </td>
                <td class="py-3 px-4">20/10/2025</td>
                <td class="py-3 px-4">
                  <Button variant="outline" size="sm">Ver</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
</script>