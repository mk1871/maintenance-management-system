<script lang="ts" setup>
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <Button
    :aria-label="themeStore.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
    class="h-9 w-9"
    size="icon"
    variant="ghost"
    @click="themeStore.toggleTheme"
  >
    <Sun v-if="themeStore.isDark" class="h-5 w-5 transition-transform duration-200" />
    <Moon v-else class="h-5 w-5 transition-transform duration-200" />
  </Button>
</template>
