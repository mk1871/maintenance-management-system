<script lang="ts" setup>
import { Moon, Sun, Monitor } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/composables/useTheme'

const { theme, setTheme } = useTheme()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button aria-label="Cambiar tema" size="icon" variant="ghost">
        <Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon
          class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem :class="{ 'bg-accent': theme === 'light' }" @click="setTheme('light')">
        <Sun class="mr-2 h-4 w-4" />
        Claro
      </DropdownMenuItem>
      <DropdownMenuItem :class="{ 'bg-accent': theme === 'dark' }" @click="setTheme('dark')">
        <Moon class="mr-2 h-4 w-4" />
        Oscuro
      </DropdownMenuItem>
      <DropdownMenuItem :class="{ 'bg-accent': theme === 'system' }" @click="setTheme('system')">
        <Monitor class="mr-2 h-4 w-4" />
        Sistema
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
