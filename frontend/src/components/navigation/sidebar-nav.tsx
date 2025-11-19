'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package2,
  Calendar,
  CheckCircle2,
  BarChart3,
  Shield,
  Settings,
  ChevronRight,
  Sparkles,
  Inbox,
  FlaskConical,
  Map,
  BookOpen,
  Rocket,
  TrendingUp,
  Users,
  Filter,
  Layers,
  Boxes,
  GitBranch,
  Activity,
  Sliders,
  FileCheck,
  FileText,
  FileDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export type NavigationItem = {
  label: string
  href?: Route
  icon?: React.ReactNode
  disabled?: boolean
  badge?: string | number
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Produtos',
    href: '/produtos',
    icon: <Package2 className="h-5 w-5" />,
  },
  {
    label: 'Demandas',
    href: '/demandas',
    icon: <Inbox className="h-5 w-5" />,
    badge: 'Novo',
  },
  {
    label: 'Triagem',
    href: '/triagem',
    icon: <Filter className="h-5 w-5" />,
    badge: 27,
  },
  {
    label: 'Discovery',
    href: '/discovery',
    icon: <FlaskConical className="h-5 w-5" />,
    badge: 'Novo',
  },
  {
    label: 'Planejamento',
    icon: <Map className="h-5 w-5" />,
    children: [
      { label: 'Dashboard', href: '/planejamento', icon: <LayoutDashboard className="h-4 w-4" /> },
      {
        label: 'Planning Trimestral',
        href: '/planejamento/planning-trimestral',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        label: 'Épicos',
        href: '/planejamento/epicos',
        icon: <Layers className="h-4 w-4" />,
      },
      {
        label: 'Features',
        href: '/planejamento/features',
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        label: 'Dependências',
        href: '/planejamento/dependencias',
        icon: <GitBranch className="h-4 w-4" />,
      },
      {
        label: 'Roadmap Timeline',
        href: '/planejamento/roadmap',
        icon: <Activity className="h-4 w-4" />,
      },
      {
        label: 'Simulador de Cenários',
        href: '/planejamento/simulador',
        icon: <Sliders className="h-4 w-4" />,
      },
      {
        label: 'Compromissos Trimestrais',
        href: '/planejamento/compromissos',
        icon: <FileCheck className="h-4 w-4" />,
      },
      {
        label: 'Capacidade por Squad',
        href: '/planejamento/capacidade',
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: 'Configuração',
        href: '/planejamento/configuracao',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Documentação',
    icon: <BookOpen className="h-5 w-5" />,
    children: [
      {
        label: 'Biblioteca',
        href: '/documentacao',
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        label: 'Novo Documento',
        href: '/documentacao/novo',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        label: 'Release Notes',
        icon: <FileDown className="h-4 w-4" />,
        disabled: true,
        badge: 'Em breve',
      },
    ],
  },
  {
    label: 'Validação',
    icon: <Rocket className="h-5 w-5" />,
    disabled: true,
    children: [
      { label: 'Go-to-Market', icon: <Rocket className="h-4 w-4" />, disabled: true },
      { label: 'Checklists', icon: <CheckCircle2 className="h-4 w-4" />, disabled: true },
    ],
  },
  {
    label: 'Métricas',
    icon: <TrendingUp className="h-5 w-5" />,
    disabled: true,
    children: [
      { label: 'KPIs', icon: <BarChart3 className="h-4 w-4" />, disabled: true },
      { label: 'Health Score', icon: <Shield className="h-4 w-4" />, disabled: true },
    ],
  },
  {
    label: 'Governança',
    icon: <Users className="h-5 w-5" />,
    disabled: true,
  },
]

const settingsItems: NavigationItem[] = [
  {
    label: 'Configurações do Tenant',
    href: '/settings/tenant',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: 'Catálogos flexíveis',
    href: '/settings/catalogos',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    label: 'Usuários & acessos',
    href: '/settings/usuarios',
    icon: <Users className="h-5 w-5" />,
  },
]

interface SidebarNavProps {
  isCollapsed?: boolean
}

export function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  const pathname = usePathname()

  const NavItem = ({ item, depth = 0 }: { item: NavigationItem; depth?: number }) => {
    const isActive = item.href ? pathname === item.href : false
    const hasChildren = item.children && item.children.length > 0

    const content = (
      <>
        {item.icon && <span className={cn('shrink-0', depth > 0 && 'ml-2')}>{item.icon}</span>}
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto h-5 px-1 text-[10px]">
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform" />
            )}
          </>
        )}
      </>
    )

    const className = cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-hover-secondary dark:hover:bg-secondary-800',
      depth > 0 && 'pl-10',
      item.disabled
        ? 'cursor-not-allowed opacity-50'
        : isActive
          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-950 dark:text-primary-400 dark:hover:bg-primary-900'
          : 'text-text-secondary hover:text-text-primary dark:text-secondary-400 dark:hover:text-secondary-100',
      isCollapsed && 'justify-center',
    )

    if (item.disabled || !item.href) {
      return (
        <motion.button
          className={className}
          disabled={item.disabled}
          whileHover={{ x: !isCollapsed ? 5 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {content}
        </motion.button>
      )
    }

    return (
      <motion.div
        whileHover={{ x: !isCollapsed ? 5 : 0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Link href={item.href} className={className}>
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navigationItems.map((item) => (
        <div key={item.label}>
          <NavItem item={item} />
          {item.children && !isCollapsed && (
            <div className="ml-2 mt-1 space-y-1">
              {item.children.map((child) => (
                <NavItem key={child.label} item={child} depth={1} />
              ))}
            </div>
          )}
        </div>
      ))}

      <Separator className="my-4" />

      {settingsItems.map((item) => (
        <NavItem key={item.label} item={item} />
      ))}
    </nav>
  )
}
