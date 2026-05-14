'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import type { Empresa } from '@/lib/types'
import { PLANO_LABELS, STATUS_EMPRESA_LABELS, STATUS_EMPRESA_COLORS } from '@/lib/types'
import { deleteEmpresa, updateEmpresaStatus } from '@/app/admin/empresas/actions'
import { toast } from 'sonner'

interface EmpresasTableProps {
  empresas: Empresa[]
}

export function EmpresasTable({ empresas }: EmpresasTableProps) {
  const router = useRouter()

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"? Todos os dados serão perdidos.`)) {
      return
    }

    const result = await deleteEmpresa(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Empresa excluída com sucesso!')
      router.refresh()
    }
  }

  async function handleStatusChange(id: string, status: Empresa['status']) {
    const result = await updateEmpresaStatus(id, status)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Status atualizado!')
      router.refresh()
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{empresa.nome}</span>
                    <span className="text-muted-foreground text-sm block">
                      {empresa.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {empresa.cnpj || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {PLANO_LABELS[empresa.plano]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={STATUS_EMPRESA_COLORS[empresa.status]}
                  >
                    {STATUS_EMPRESA_LABELS[empresa.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {empresa.data_vencimento 
                    ? format(new Date(empresa.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })
                    : <span className="text-muted-foreground">-</span>
                  }
                </TableCell>
                <TableCell>
                  {format(new Date(empresa.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/empresas/${empresa.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {empresa.status !== 'ativo' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(empresa.id, 'ativo')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      )}
                      {empresa.status === 'ativo' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(empresa.id, 'vencido')}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Marcar como Vencido
                        </DropdownMenuItem>
                      )}
                      {empresa.status !== 'bloqueado' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(empresa.id, 'bloqueado')}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Bloquear
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(empresa.id, empresa.nome)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
