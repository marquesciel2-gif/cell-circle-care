'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'
import type { Usuario } from '@/lib/types'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const pathNames: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  consertos: 'Consertos',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  novo: 'Novo',
  editar: 'Editar',
  receitas: 'Receitas',
  despesas: 'Despesas',
}

interface DashboardHeaderProps {
  usuario: Usuario | null
}

export function DashboardHeader({ usuario }: DashboardHeaderProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Verificar se a empresa está com status vencido
  const isVencido = usuario?.empresa?.status === 'vencido'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = '/' + segments.slice(0, index + 1).join('/')
            const name = pathNames[segment] || segment

            return (
              <span key={segment} className="inline-flex items-center gap-1.5">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {isVencido && (
        <Badge variant="destructive" className="mr-2">
          Plano Vencido
        </Badge>
      )}

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-medium text-white flex items-center justify-center">
          3
        </span>
        <span className="sr-only">Notificações</span>
      </Button>
    </header>
  )
}
