'use client'

import { useAuthStore } from '@/store/auth-store'

export default function TenantSettingsPage() {
  const { user, currentTenantId } = useAuthStore()
  const currentTenant = user?.tenants.find((tenant) => tenant.id === currentTenantId)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Configurações do Tenant</h1>
        <p className="text-sm text-slate-600">
          Visualize os dados básicos do tenant selecionado e as permissões associadas.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {currentTenant ? (
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Tenant ID</dt>
              <dd className="text-lg font-semibold text-slate-900">{currentTenant.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Nome</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {currentTenant.nome ?? 'Não informado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Seu papel</dt>
              <dd className="text-lg font-semibold text-slate-900">{currentTenant.role}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500">
            Selecione um tenant ativo para visualizar detalhes.
          </p>
        )}
      </section>
    </div>
  )
}
