<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const isDark = ref(false)

/**
 * Aplica el tema al documento
 */
const applyTheme = (dark: boolean): void => {
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

/**
 * Alterna entre claro y oscuro
 */
const toggleTheme = (): void => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

/**
 * Inicializa el tema desde localStorage o sistema
 */
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  isDark.value = savedTheme === 'dark' || (!savedTheme && prefersDark)
  applyTheme(isDark.value)
})

watch(isDark, (newVal) => {
  applyTheme(newVal)
})
</script>

<template>
  <Button
    :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
    class="h-9 w-9"
    size="icon"
    variant="ghost"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="h-5 w-5 transition-transform duration-200" />
    <Moon v-else class="h-5 w-5 transition-transform duration-200" />
  </Button>
</template>
