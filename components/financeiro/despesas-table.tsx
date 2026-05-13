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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Pencil, Trash2, CheckCircle, TrendingDown, Plus } from 'lucide-react'
import type { Despesa } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import { deleteDespesa, marcarDespesaPaga } from '@/app/dashboard/financeiro/actions'
import { toast } from 'sonner'

interface DespesasTableProps {
  despesas: Despesa[]
}

export function DespesasTable({ despesas }: DespesasTableProps) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return
    }

    const result = await deleteDespesa(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Despesa excluída com sucesso!')
      router.refresh()
    }
  }

  async function handleMarcarPaga(id: string) {
    const result = await marcarDespesaPaga(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Despesa marcada como paga!')
      router.refresh()
    }
  }

  if (despesas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma despesa cadastrada</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Comece registrando suas despesas.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/financeiro/despesas/novo">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((despesa) => (
              <TableRow key={despesa.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{despesa.descricao}</span>
                    {despesa.fornecedor && (
                      <span className="text-muted-foreground text-sm block">
                        {despesa.fornecedor}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {despesa.categoria || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="font-medium text-red-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={STATUS_FINANCEIRO_COLORS[despesa.status]}
                  >
                    {STATUS_FINANCEIRO_LABELS[despesa.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(despesa.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
                      {despesa.status === 'pendente' && (
                        <DropdownMenuItem onClick={() => handleMarcarPaga(despesa.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Paga
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/financeiro/despesas/${despesa.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(despesa.id)}
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
