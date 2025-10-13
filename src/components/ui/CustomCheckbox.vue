<script lang="ts" setup>
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils.ts'

const props = defineProps<{
  checked: boolean
  id?: string
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()

const handleChange = (event: Event): void => {
  const input = event.target as HTMLInputElement
  emit('update:checked', input.checked)
}
</script>

<template>
  <div class="relative inline-flex">
    <input
      :id="id"
      :checked="checked"
      :disabled="disabled"
      class="peer absolute opacity-0 w-0 h-0"
      type="checkbox"
      @change="handleChange"
    />
    <label
      :class="
        cn(
          'size-4 shrink-0 rounded-[4px] border shadow-xs transition-all outline-none cursor-pointer flex items-center justify-center',
          'border-input hover:border-primary/50',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          checked && 'bg-primary text-primary-foreground border-primary',
          !checked && 'bg-background',
          disabled && 'cursor-not-allowed opacity-50 hover:border-input',
          props.class,
        )
      "
      :for="id"
    >
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="scale-0 opacity-0"
        enter-to-class="scale-100 opacity-100"
        leave-active-class="transition-all duration-100"
        leave-from-class="scale-100 opacity-100"
        leave-to-class="scale-0 opacity-0"
      >
        <Check v-if="checked" class="size-3.5 text-current" />
      </Transition>
    </label>
  </div>
</template>
