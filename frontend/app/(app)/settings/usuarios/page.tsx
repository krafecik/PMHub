'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  InviteSummary,
  UserSummary,
  inviteUser,
  listPendingInvites,
  listUsers,
  resendInvite,
  revokeInvite,
  unlockUserAccount,
  updateUserTenantRole,
} from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HelpButton, usuariosHelpContent } from '@/components/ui/help-button'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unlock,
  UserPlus,
  MoreVertical,
  UserX,
} from 'lucide-react'
import { TenantInfo } from '@/store/auth-store'

const TENANT_ROLE_VALUES = ['CPO', 'PM', 'VIEWER'] as const
type TenantRoleValue = (typeof TENANT_ROLE_VALUES)[number]

const AVAILABLE_ROLES: Array<{ value: TenantRoleValue; label: string; description: string }> = [
  {
    value: 'CPO',
    label: 'CPO / Owner',
    description: 'Acesso total à gestão do tenant, inclusive convites e configurações críticas.',
  },
  {
    value: 'PM',
    label: 'Product Manager',
    description: 'Pode criar, priorizar e acompanhar iniciativas de produto.',
  },
  {
    value: 'VIEWER',
    label: 'Visualizador',
    description: 'Acesso somente leitura para acompanhar métricas e decisões.',
  },
]

const inviteSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  nome: z
    .string()
    .min(3, 'Informe o nome do convidado.')
    .max(80, 'Nome muito longo, utilize abreviações.'),
  tenantId: z.string().min(1, 'Selecione o tenant.'),
  role: z.enum(TENANT_ROLE_VALUES, {
    errorMap: () => ({ message: 'Selecione o perfil de acesso.' }),
  }),
  mensagem: z
    .string()
    .max(280, 'A mensagem pode ter no máximo 280 caracteres.')
    .optional()
    .or(z.literal('')),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function UserManagementSettingsPage() {
  const { user, currentTenantId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const tenantsForSelection = useMemo<TenantInfo[]>(() => user?.tenants ?? [], [user?.tenants])

  const {
    data: users,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
  } = useQuery({
    queryKey: ['users', currentTenantId],
    queryFn: () => listUsers({ tenantId: currentTenantId ?? undefined }),
    retry: false,
  })

  const {
    data: invites,
    isLoading: isLoadingInvites,
    isError: isInvitesError,
    error: invitesError,
  } = useQuery({
    queryKey: ['user-invites', currentTenantId],
    queryFn: () => listPendingInvites({ tenantId: currentTenantId ?? undefined }),
    retry: false,
  })

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] })
      toast({
        title: 'Convite enviado',
        description: 'O convidado receberá um e-mail com instruções de acesso.',
      })
    },
    onError: (error: unknown) => {
      toast({
        title: 'Falha ao enviar convite',
        description:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao enviar o convite. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => {
      toast({
        title: 'Convite reenviado',
        description: 'O contato recebeu novamente a mensagem de convite.',
      })
    },
    onError: (error: unknown) => {
      toast({
        title: 'Não foi possível reenviar o convite',
        description:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao reenviar. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const revokeInviteMutation = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] })
      toast({
        title: 'Convite revogado',
        description: 'O acesso provisório foi cancelado com sucesso.',
      })
    },
    onError: (error: unknown) => {
      toast({
        title: 'Não foi possível revogar o convite',
        description:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao revogar convite. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const unlockUserMutation = useMutation({
    mutationFn: unlockUserAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Usuário desbloqueado',
        description: 'O colaborador poderá tentar acessar novamente.',
      })
    },
    onError: (error: unknown) => {
      toast({
        title: 'Falha ao desbloquear usuário',
        description:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao desbloquear. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: updateUserTenantRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Perfil atualizado',
        description: 'O nível de acesso do usuário foi ajustado.',
      })
    },
    onError: (error: unknown) => {
      toast({
        title: 'Não foi possível atualizar o perfil',
        description:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao atualizar perfil. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const totalUsers = users?.length ?? 0
  const activeUsers = useMemo(
    () => (users ?? []).filter((u) => u.status === 'ACTIVE').length,
    [users],
  )
  const lockedUsers = useMemo(
    () => (users ?? []).filter((u) => u.status === 'LOCKED').length,
    [users],
  )
  const totalInvites = invites?.length ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Acesso</h1>
          <p className="text-sm text-slate-600">
            Convide novos colaboradores, acompanhe convites pendentes e ajuste perfis de acesso do
            tenant selecionado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar usuário
          </Button>
          <HelpButton
            title="Como funciona a gestão de usuários?"
            content={usuariosHelpContent}
            className="border border-slate-200"
          />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Usuários ativos"
          value={activeUsers}
          subtitle={`${totalUsers} cadastrados`}
          icon={<ShieldCheck className="h-4 w-4 text-primary-600" />}
        />
        <SummaryCard
          title="Convites pendentes"
          value={totalInvites}
          subtitle="Aguardando aceitação"
          icon={<UserPlus className="h-4 w-4 text-accent-600" />}
        />
        <SummaryCard
          title="Bloqueados"
          value={lockedUsers}
          subtitle="Devido a tentativas ou bloqueio manual"
          icon={<Unlock className="text-warning-600 h-4 w-4" />}
        />
      </section>

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList className="w-full max-w-md justify-start">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <DataPanel
            isLoading={isLoadingUsers}
            isError={isUsersError}
            error={usersError}
            emptyMessage="Nenhum usuário encontrado para este tenant."
            isEmpty={(users ?? []).length === 0}
          >
            <UsersTable
              users={users ?? []}
              onChangeRole={(payload) => updateRoleMutation.mutate(payload)}
              onUnlock={(userId) => unlockUserMutation.mutate(userId)}
              isUpdatingRole={updateRoleMutation.isPending}
              isUnlocking={unlockUserMutation.isPending}
            />
          </DataPanel>
        </TabsContent>

        <TabsContent value="convites">
          <DataPanel
            isLoading={isLoadingInvites}
            isError={isInvitesError}
            error={invitesError}
            emptyMessage="Nenhum convite ativo. Utilize o botão “Convidar usuário” para iniciar."
            isEmpty={(invites ?? []).length === 0}
          >
            <InvitesTable
              invites={invites ?? []}
              onResend={(inviteId) => resendInviteMutation.mutate(inviteId)}
              onRevoke={(inviteId) => revokeInviteMutation.mutate(inviteId)}
              isProcessing={resendInviteMutation.isPending || revokeInviteMutation.isPending}
            />
          </DataPanel>
        </TabsContent>
      </Tabs>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        defaultTenantId={currentTenantId ?? undefined}
        availableTenants={tenantsForSelection}
        onSubmit={async (values) => {
          await inviteMutation.mutateAsync(values)
          setInviteDialogOpen(false)
        }}
        isSubmitting={inviteMutation.isPending}
      />
    </div>
  )
}

type SummaryCardProps = {
  title: string
  value: number
  subtitle?: string
  icon?: ReactNode
}

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <div>
          <h3 className="text-xs font-medium text-slate-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-full bg-slate-100 p-2">{icon}</div>}
      </CardContent>
    </Card>
  )
}

type DataPanelProps = {
  isLoading: boolean
  isError: boolean
  error: unknown
  emptyMessage: string
  isEmpty: boolean
  children: ReactNode
}

function DataPanel({ isLoading, isError, error, emptyMessage, isEmpty, children }: DataPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-10 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando dados...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-error-light bg-error-light/15 p-6 text-sm text-error-dark">
        Não foi possível carregar os dados desta sessão.{' '}
        <span className="font-medium">
          {error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.'}
        </span>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return <div className="rounded-xl border border-slate-200 bg-white shadow-sm">{children}</div>
}

type UsersTableProps = {
  users: UserSummary[]
  isUpdatingRole: boolean
  isUnlocking: boolean
  onChangeRole: (payload: { userId: string; tenantId: string; role: string }) => void
  onUnlock: (userId: string) => void
}

function UsersTable({
  users,
  isUpdatingRole,
  isUnlocking,
  onChangeRole,
  onUnlock,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead className="w-[200px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium text-slate-900">{user.nome}</div>
                <div className="text-xs text-slate-500">
                  {user.provider === 'LOCAL' ? 'Senha nativa' : 'Azure AD'}
                </div>
              </TableCell>
              <TableCell className="align-top">
                <div className="text-sm text-slate-700">{user.email}</div>
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-1">
                  {user.tenants.map((tenant) => (
                    <RoleBadge
                      key={`${tenant.tenantId}-${tenant.role}`}
                      tenantName={tenant.nome ?? tenant.tenantId}
                      role={tenant.role}
                      onChangeRole={(role) =>
                        onChangeRole({ userId: user.id, tenantId: tenant.tenantId, role })
                      }
                      disabled={isUpdatingRole}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell className="align-top">
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="align-top text-sm text-slate-600">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
                  : 'Nunca acessou'}
              </TableCell>
              <TableCell className="align-top">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu de ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === 'LOCKED' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onUnlock(user.id)}
                            disabled={isUnlocking}
                          >
                            <Unlock className="mr-2 h-4 w-4" />
                            Desbloquear
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem disabled>
                        <UserX className="mr-2 h-4 w-4" />
                        Remover do tenant
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function UserStatusBadge({ status }: { status: UserSummary['status'] }) {
  const config: Record<UserSummary['status'], { label: string; tone: string }> = {
    ACTIVE: { label: 'Ativo', tone: 'bg-emerald-100 text-emerald-700' },
    INVITED: { label: 'Convite pendente', tone: 'bg-sky-100 text-sky-700' },
    LOCKED: { label: 'Bloqueado', tone: 'bg-orange-100 text-orange-700' },
    DISABLED: { label: 'Desativado', tone: 'bg-slate-200 text-slate-600' },
    DRAFT: { label: 'Rascunho', tone: 'bg-yellow-100 text-yellow-700' },
  }
  const { label, tone } = config[status]
  return <Badge className={cn('border-none font-medium', tone)}>{label}</Badge>
}

type RoleBadgeProps = {
  tenantName: string
  role: string
  disabled: boolean
  onChangeRole: (role: string) => void
}

function RoleBadge({ tenantName, role, disabled, onChangeRole }: RoleBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div>
        <span className="font-semibold text-slate-700">{tenantName}</span>
        <span className="mx-1 text-slate-400">•</span>
      </div>
      <Select
        defaultValue={role}
        disabled={disabled}
        onValueChange={(value) => onChangeRole(value)}
      >
        <SelectTrigger className="h-7 w-auto min-w-[120px] bg-white text-xs">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent className="text-xs">
          {AVAILABLE_ROLES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type InvitesTableProps = {
  invites: InviteSummary[]
  isProcessing: boolean
  onResend: (inviteId: string) => void
  onRevoke: (inviteId: string) => void
}

function InvitesTable({ invites, isProcessing, onResend, onRevoke }: InvitesTableProps) {
  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Nenhum convite ativo no momento.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-mail</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tenant / Perfil</TableHead>
            <TableHead>Enviado em</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead className="w-[200px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium text-slate-800">{invite.email}</TableCell>
              <TableCell>{invite.nome ?? 'Não informado'}</TableCell>
              <TableCell>
                <div className="text-sm text-slate-700">{invite.tenantNome ?? invite.tenantId}</div>
                <div className="text-xs text-slate-500">{invite.role}</div>
              </TableCell>
              <TableCell>
                {new Date(invite.invitedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>{new Date(invite.expiresAt).toLocaleString('pt-BR')}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResend(invite.id)}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Reenviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRevoke(invite.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Revogar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

type InviteUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTenants: TenantInfo[]
  defaultTenantId?: string
  onSubmit: (values: InviteFormValues) => Promise<void>
  isSubmitting: boolean
}

function InviteUserDialog({
  open,
  onOpenChange,
  availableTenants,
  defaultTenantId,
  onSubmit,
  isSubmitting,
}: InviteUserDialogProps) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      tenantId: defaultTenantId ?? availableTenants[0]?.id ?? '',
      role: AVAILABLE_ROLES[1]?.value ?? 'PM',
      mensagem: '',
    },
  })

  const fallbackTenantId = useMemo(
    () => defaultTenantId ?? availableTenants[0]?.id ?? '',
    [availableTenants, defaultTenantId],
  )

  useEffect(() => {
    if (fallbackTenantId) {
      form.setValue('tenantId', fallbackTenantId)
    }
  }, [fallbackTenantId, form])

  const handleClose = (value: boolean) => {
    if (!value) {
      form.reset({
        email: '',
        nome: '',
        tenantId: defaultTenantId ?? availableTenants[0]?.id ?? '',
        role: AVAILABLE_ROLES[1]?.value ?? 'PM',
        mensagem: '',
      })
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Convidar novo usuário</DialogTitle>
          <DialogDescription>
            Envie um convite com validade configurada para que o colaborador defina a própria senha
            e entre com o perfil adequado ao tenant.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 py-2"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values)
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail corporativo</Label>
              <Input
                id="invite-email"
                placeholder="pessoa@empresa.com"
                {...form.register('email')}
                error={Boolean(form.formState.errors.email)}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-error-dark">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome completo</Label>
              <Input
                id="invite-name"
                placeholder="Como será exibido internamente"
                {...form.register('nome')}
                error={Boolean(form.formState.errors.nome)}
              />
              {form.formState.errors.nome && (
                <p className="text-xs text-error-dark">{form.formState.errors.nome.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select
                defaultValue={form.getValues('tenantId')}
                onValueChange={(value) =>
                  form.setValue('tenantId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um tenant" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.nome ?? tenant.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.tenantId && (
                <p className="text-xs text-error-dark">{form.formState.errors.tenantId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <Select
                defaultValue={form.getValues('role')}
                onValueChange={(value: TenantRoleValue) =>
                  form.setValue('role', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-xs text-error-dark">{form.formState.errors.role.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Mensagem (opcional)</Label>
            <Textarea
              id="invite-message"
              placeholder="Inclua orientações adicionais para o convidado."
              rows={3}
              {...form.register('mensagem')}
            />
            {form.formState.errors.mensagem && (
              <p className="text-xs text-error-dark">{form.formState.errors.mensagem.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
            Enviar convite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
