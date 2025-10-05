<template>
  <div class="container mx-auto py-6">
    <div class="flex items-center mb-6">
      <Button variant="outline" class="mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-foreground">Tarea #1234</h1>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Accommodation</Label>
                <p class="text-foreground">ABC1 - Apartamento Central</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Área</Label>
                <p class="text-foreground">Baño Principal</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Elemento</Label>
                <p class="text-foreground">Cañería</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Prioridad</Label>
                <Badge variant="destructive">Alta</Badge>
              </div>
              <div class="col-span-2">
                <Label class="text-sm font-medium text-muted-foreground">Descripción</Label>
                <p class="text-foreground mt-1">Fuga de agua en cañería principal del baño. Se requiere reparación inmediata para evitar daños mayores.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estado de Reparación</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-center space-x-4">
              <Badge variant="secondary">Pendiente</Badge>
              <Button>Comenzar Reparación</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Galería de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-3 gap-4">
              <div class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <span class="text-muted-foreground">Foto 1</span>
              </div>
              <div class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <span class="text-muted-foreground">Foto 2</span>
              </div>
              <div class="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <span class="text-muted-foreground">Foto 3</span>
              </div>
            </div>
            <Button variant="outline" class="mt-4 w-full">
              Subir Fotos
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Detección</Label>
                <p class="text-foreground">05/10/2025</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</Label>
                <p class="text-foreground">15/10/2025</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Etiquetas</Label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline">Fontanería</Badge>
                  <Badge variant="outline">Urgente</Badge>
                </div>
              </div>
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Costos</Label>
                <p class="text-foreground">€0.00 (sin registrar)</p>
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
              <Button class="w-full">Agregar Comentario</Button>
              <Button variant="outline" class="w-full">Registrar Costo</Button>
              <Button variant="outline" class="w-full">Completar Tarea</Button>
              <Button variant="outline" class="w-full">Duplicar Tarea</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
</script>