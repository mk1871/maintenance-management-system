<script lang="ts" setup>
import { Label } from '@/components/ui/label'
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
 * Componente para campos básicos del formulario de Accommodation
 * Usa FormField de shadcn-vue para validación automática
 * No recibe props, se conecta automáticamente al formulario padre
 */
</script>

<template>
  <div class="space-y-4">
    <!-- Código del Alojamiento -->
    <FormField v-slot="{ componentField }" name="code">
      <FormItem>
        <FormLabel>Código *</FormLabel>
        <FormControl>
          <Input
            class="uppercase"
            maxlength="4"
            placeholder="Ej: A101"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>
          Código único del alojamiento (1-4 caracteres, solo mayúsculas y números)
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Nombre del Alojamiento -->
    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>Nombre *</FormLabel>
        <FormControl>
          <Input
            placeholder="Ej: Apartamento Playa Vista"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>
          Nombre descriptivo del alojamiento (mínimo 3 caracteres)
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Dirección -->
    <FormField v-slot="{ componentField }" name="address">
      <FormItem>
        <FormLabel>Dirección</FormLabel>
        <FormControl>
          <Input
            placeholder="Ej: Calle 123, Ciudad"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>
          Dirección física del alojamiento (opcional)
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Estado -->
    <FormField v-slot="{ componentField }" name="status">
      <FormItem>
        <FormLabel>Estado *</FormLabel>
        <Select v-bind="componentField">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>
          Estado operativo del alojamiento
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Notas -->
    <FormField v-slot="{ componentField }" name="notes">
      <FormItem>
        <FormLabel>Notas</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Notas adicionales sobre el alojamiento..."
            rows="3"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription>
          Información adicional sobre el alojamiento (opcional)
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>
