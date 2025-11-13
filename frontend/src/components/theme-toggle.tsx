'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'
import { Button } from '@/components/ui/button'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 min-w-[160px] rounded-lg border bg-white p-1.5 shadow-lg dark:border-secondary-800 dark:bg-secondary-900"
          sideOffset={5}
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-text-muted dark:text-secondary-400">
            Tema
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-border dark:bg-secondary-800" />

          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isSelected = theme === themeOption.value

            return (
              <DropdownMenu.Item
                key={themeOption.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors',
                  'hover:bg-secondary-100 hover:text-text-primary',
                  'focus:bg-secondary-100 focus:text-text-primary',
                  'dark:hover:bg-secondary-800 dark:hover:text-secondary-100',
                  'dark:focus:bg-secondary-800 dark:focus:text-secondary-100',
                  isSelected &&
                    'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400',
                )}
                onSelect={() => setTheme(themeOption.value)}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{themeOption.label}</span>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                )}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
