'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TenantSwitcher } from './tenant-switcher'
import { SidebarNav } from './navigation/sidebar-nav'
import { useAuthStore } from '@/store/auth-store'
import { logout } from '@/lib/auth-api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Bell, LogOut, Menu, X, Search, Command } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const { user, clearSession } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  async function handleLogout() {
    await logout()
    clearSession()
    router.replace('/login')
  }

  return (
    <TooltipProvider>
      <div className="bg-secondary flex min-h-screen dark:bg-secondary-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-white transition-all duration-300 lg:sticky lg:z-auto dark:border-secondary-800 dark:bg-secondary-900',
            isCollapsed ? 'w-16' : 'w-64',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          {/* Logo area */}
          <div className="flex h-16 items-center justify-between border-b px-4 dark:border-secondary-800">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white">
                  C
                </div>
                <span className="gradient-text text-xl font-bold">CPOPM Hub</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn('lg:hidden', isCollapsed && 'mx-auto')}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <SidebarNav isCollapsed={isCollapsed} />
          </nav>

          {/* Version */}
          <div className="border-t p-4 dark:border-secondary-800">
            <div
              className={cn(
                'flex items-center gap-2 text-xs text-text-muted',
                isCollapsed && 'justify-center',
              )}
            >
              {!isCollapsed && (
                <>
                  <div className="bg-success-DEFAULT h-2 w-2 animate-pulse rounded-full" />
                  <span>v0.1 • MVP</span>
                </>
              )}
            </div>
          </div>

          {/* Collapse toggle */}
          <div className="hidden border-t p-2 lg:block dark:border-secondary-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-secondary-800 dark:bg-secondary-900/95 dark:supports-[backdrop-filter]:bg-secondary-900/60">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search bar */}
              <div className="hidden items-center gap-2 rounded-lg bg-secondary-100 px-3 py-2 text-sm text-text-muted md:flex dark:bg-secondary-800 dark:text-secondary-400">
                <Search className="h-4 w-4" />
                <span>Buscar...</span>
                <kbd className="ml-8 rounded border bg-white px-1.5 py-0.5 text-xs">
                  <Command className="inline h-3 w-3" />K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <TenantSwitcher />

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="bg-error-DEFAULT absolute right-1 top-1 h-2 w-2 rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notificações</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-sm lg:block">
                  <div className="font-medium text-text-primary">{user?.nome}</div>
                  <div className="text-text-muted">{user?.email}</div>
                </div>

                <Avatar>
                  <AvatarFallback>{user?.nome ? getInitials(user.nome) : 'U'}</AvatarFallback>
                </Avatar>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleLogout} variant="ghost" size="icon">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
