'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { selectTenant } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TenantSwitcher() {
  const { user, currentTenantId, setSession } = useAuthStore()
  const [isSwitching, setIsSwitching] = useState(false)
  const [open, setOpen] = useState(false)
  const tenants = user?.tenants ?? []

  async function handleTenantChange(tenantId: string) {
    if (!tenantId || tenantId === currentTenantId) {
      return
    }

    setIsSwitching(true)
    setOpen(false)

    try {
      const session = await selectTenant(tenantId)
      setSession(session)
    } finally {
      setIsSwitching(false)
    }
  }

  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? tenants[0]

  if (tenants.length === 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        Nenhum tenant atribuído
      </Badge>
    )
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          className={cn('flex items-center gap-2 font-normal', isSwitching && 'opacity-50')}
          disabled={isSwitching}
        >
          <Building2 className="h-4 w-4 text-text-muted" />
          <span className="max-w-[200px] truncate">
            {currentTenant?.nome ?? `Tenant ${currentTenant?.id}`}
          </span>
          <ChevronDown className="ml-1 h-4 w-4 text-text-muted" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 min-w-[200px] rounded-lg border bg-white p-1.5 shadow-lg"
          sideOffset={5}
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-text-muted">
            Selecione o Tenant
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {tenants.map((tenant) => {
            const isSelected = tenant.id === currentTenantId
            return (
              <DropdownMenu.Item
                key={tenant.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors',
                  'hover:bg-secondary-100 hover:text-text-primary',
                  'focus:bg-secondary-100 focus:text-text-primary',
                  isSelected && 'bg-primary-50 text-primary-700',
                )}
                onSelect={() => handleTenantChange(tenant.id)}
              >
                <Building2 className="h-4 w-4" />
                <span className="flex-1 truncate">{tenant.nome ?? `Tenant ${tenant.id}`}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
