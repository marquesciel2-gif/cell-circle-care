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
import { MoreHorizontal, Eye, Pencil, Trash2, Printer, CheckCircle } from 'lucide-react'
import type { Conserto, Cliente } from '@/lib/types'
import { STATUS_CONSERTO_LABELS, STATUS_CONSERTO_COLORS } from '@/lib/types'
import { deleteConserto, updateConsertoStatus } from '@/app/dashboard/consertos/actions'
import { toast } from 'sonner'

interface ConsertosTableProps {
  consertos: (Conserto & { cliente: Pick<Cliente, 'id' | 'nome' | 'telefone'> | null })[]
}

export function ConsertosTable({ consertos }: ConsertosTableProps) {
  const router = useRouter()

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`Tem certeza que deseja excluir o conserto "${numero}"?`)) {
      return
    }

    const result = await deleteConserto(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Conserto excluído com sucesso!')
      router.refresh()
    }
  }

  async function handleStatusChange(id: string, status: Conserto['status']) {
    const result = await updateConsertoStatus(id, status)
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
              <TableHead>OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consertos.map((conserto) => (
              <TableRow key={conserto.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/dashboard/consertos/${conserto.id}`}
                    className="text-emerald-500 hover:underline"
                  >
                    {conserto.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  {conserto.cliente?.nome || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <div>
                    <span>{conserto.dispositivo}</span>
                    {(conserto.marca || conserto.modelo) && (
                      <span className="text-muted-foreground text-sm block">
                        {[conserto.marca, conserto.modelo].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={STATUS_CONSERTO_COLORS[conserto.status]}
                  >
                    {STATUS_CONSERTO_LABELS[conserto.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(conserto.data_entrada), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {conserto.valor > 0 ? (
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conserto.valor)
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
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
                        <Link href={`/dashboard/consertos/${conserto.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/consertos/${conserto.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {conserto.status === 'em_reparo' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(conserto.id, 'pronto')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Pronto
                        </DropdownMenuItem>
                      )}
                      {conserto.status === 'pronto' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(conserto.id, 'entregue')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Entregue
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(conserto.id, conserto.numero)}
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
