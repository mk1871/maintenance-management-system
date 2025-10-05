<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Accommodations</h1>
      <AccommodationForm />
    </div>
    
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tareas Pendientes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>ABC1</TableCell>
                <TableCell>Apartamento Central</TableCell>
                <TableCell>Calle Principal 123</TableCell>
                <TableCell>
                  <Badge variant="default">Activo</Badge>
                </TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" @click="$router.push('/accommodations/ABC1')">Ver</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>XYZ2</TableCell>
                <TableCell>Loft Moderno</TableCell>
                <TableCell>Avenida Moderna 456</TableCell>
                <TableCell>
                  <Badge variant="default">Activo</Badge>
                </TableCell>
                <TableCell>1</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" @click="$router.push('/accommodations/XYZ2')">Ver</Button>
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
import AccommodationForm from '@/components/accommodations/AccommodationForm.vue'
</script>