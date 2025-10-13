<script lang="ts" setup>
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
  notes: string
}

interface FormErrors {
  code: string
  name: string
}

defineProps<{
  formData: FormData
  errors: FormErrors
}>()

const emit = defineEmits<{
  (e: 'update:code', value: string): void
  (e: 'update:name', value: string): void
  (e: 'update:address', value: string): void
  (e: 'update:status', value: 'active' | 'inactive'): void
  (e: 'update:notes', value: string): void
}>()
</script>

<template>
  <div class="grid gap-4 py-4">
    <!-- Código -->
    <div class="space-y-2">
      <Label for="code">Código *</Label>
      <Input
        id="code"
        :class="{ 'border-destructive': errors.code }"
        :model-value="formData.code"
        maxlength="4"
        placeholder="Ej: A101"
        @update:model-value="(val) => emit('update:code', String(val))"
      />
      <p v-if="errors.code" class="text-sm font-medium text-destructive">
        {{ errors.code }}
      </p>
    </div>

    <!-- Nombre -->
    <div class="space-y-2">
      <Label for="name">Nombre *</Label>
      <Input
        id="name"
        :class="{ 'border-destructive': errors.name }"
        :model-value="formData.name"
        placeholder="Nombre del alojamiento"
        @update:model-value="(val) => emit('update:name', String(val))"
      />
      <p v-if="errors.name" class="text-sm font-medium text-destructive">
        {{ errors.name }}
      </p>
    </div>

    <!-- Dirección -->
    <div class="space-y-2">
      <Label for="address">Dirección</Label>
      <Input
        id="address"
        :model-value="formData.address"
        placeholder="Dirección completa"
        @update:model-value="(val) => emit('update:address', String(val))"
      />
    </div>

    <!-- Estado -->
    <div class="space-y-2">
      <Label for="status">Estado</Label>
      <Select
        id="status"
        :model-value="formData.status"
        @update:model-value="(val) => val && emit('update:status', String(val) as 'active' | 'inactive')"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Activo</SelectItem>
          <SelectItem value="inactive">Inactivo</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Notas -->
    <div class="space-y-2">
      <Label for="notes">Notas</Label>
      <Textarea
        id="notes"
        :model-value="formData.notes"
        placeholder="Notas adicionales..."
        rows="3"
        @update:model-value="(val) => emit('update:notes', String(val))"
      />
    </div>
  </div>
</template>
