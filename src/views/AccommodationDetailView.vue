<template>
  <div class="container mx-auto py-6">
    <div class="flex items-center mb-6">
      <button class="mr-4 text-primary hover:text-primary/80">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h1 class="text-3xl font-bold text-foreground">ABC1 - Apartamento Central</h1>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Código</Label>
                <p class="text-foreground">ABC1</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Nombre</Label>
                <p class="text-foreground">Apartamento Central</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Dirección</Label>
                <p class="text-foreground">Calle Principal 123</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Estado</Label>
                <Badge class="ml-2 bg-green-100 text-green-800">Activo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tareas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="border-l-4 border-primary pl-4 py-2">
                <h3 class="font-medium text-foreground">Fuga de agua en baño principal</h3>
                <p class="text-sm text-muted-foreground">Prioridad: Alta • Estado: En progreso</p>
              </div>
              <div class="border-l-4 border-destructive pl-4 py-2">
                <h3 class="font-medium text-foreground">Puerta de entrada no cierra bien</h3>
                <p class="text-sm text-muted-foreground">Prioridad: Media • Estado: Pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Tareas Pendientes</span>
                <span class="font-medium">5</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Tareas en Progreso</span>
                <span class="font-medium">2</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Tareas Completadas</span>
                <span class="font-medium">23</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Costo Total</span>
                <span class="font-medium">€1,240</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <Button class="w-full">
                Crear Nueva Tarea
              </Button>
              <Button variant="outline" class="w-full">
                Editar Accommodation
              </Button>
              <Button variant="outline" class="w-full">
                Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
</script>