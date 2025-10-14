<script lang="ts" setup>
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

/**
 * Campos básicos del formulario de Accommodation
 * Layout optimizado basado en mejores prácticas de UX
 * Fuente: Baymard Institute, WPForms, HubSpot
 */
</script>

<template>
  <div class="space-y-4">
    <!-- Fila 1: Código + Nombre (campos relacionados) -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <!-- Código: 2 columnas (corto) -->
      <div class="md:col-span-3">
        <FormField v-slot="{ componentField }" name="code">
          <FormItem>
            <FormLabel>Código *</FormLabel>
            <FormControl>
              <Input
                class="uppercase"
                maxlength="4"
                placeholder="A101"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Nombre: 6 columnas (principal) -->
      <div class="md:col-span-6">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Apartamento Playa Vista"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Estado: 3 columnas (dropdown) -->
      <div class="md:col-span-3">
        <FormField v-slot="{ componentField }" name="status">
          <FormItem>
            <FormLabel>Estado *</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
    </div>

    <!-- Fila 2: Dirección (puede compartir si es necesario) -->
    <FormField v-slot="{ componentField }" name="address">
      <FormItem>
        <FormLabel>Dirección</FormLabel>
        <FormControl>
          <Input
            placeholder="Ej: Calle 123, Ciudad"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Fila 3: Notas (textarea siempre ancho completo) -->
    <FormField v-slot="{ componentField }" name="notes">
      <FormItem>
        <FormLabel>Notas</FormLabel>
        <FormControl>
          <Textarea
            class="resize-none"
            placeholder="Información adicional..."
            rows="3"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>
