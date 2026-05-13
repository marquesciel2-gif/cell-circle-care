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
import { Badge } from '@/components/ui/badge'

const pathNames: Record<string, string> = {
  admin: 'Admin',
  empresas: 'Empresas',
  usuarios: 'Usuários',
  novo: 'Novo',
  editar: 'Editar',
}

interface AdminHeaderProps {
  usuario: Usuario | null
}

export function AdminHeader({ usuario }: AdminHeaderProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

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
              <BreadcrumbItem key={segment}>
                {index > 0 && <BreadcrumbSeparator />}
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
        Admin Master
      </Badge>
    </header>
  )
}
