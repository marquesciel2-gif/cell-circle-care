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
import { MoreHorizontal, Pencil, Trash2, CheckCircle, DollarSign, Plus } from 'lucide-react'
import type { Receita, Cliente, Conserto } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import { deleteReceita, marcarReceitaPaga } from '@/app/dashboard/financeiro/actions'
import { toast } from 'sonner'

interface ReceitasTableProps {
  receitas: (Receita & { cliente: Pick<Cliente, 'nome'> | null; conserto: Pick<Conserto, 'numero'> | null })[]
}

export function ReceitasTable({ receitas }: ReceitasTableProps) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
      return
    }

    const result = await deleteReceita(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Receita excluída com sucesso!')
      router.refresh()
    }
  }

  async function handleMarcarPaga(id: string) {
    const result = await marcarReceitaPaga(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Receita marcada como paga!')
      router.refresh()
    }
  }

  if (receitas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma receita cadastrada</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Comece registrando suas receitas.
          </p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/financeiro/receitas/novo">
              <Plus className="mr-2 h-4 w-4" />
              Nova Receita
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
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receitas.map((receita) => (
              <TableRow key={receita.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{receita.descricao}</span>
                    {receita.conserto && (
                      <span className="text-muted-foreground text-sm block">
                        OS: {receita.conserto.numero}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {receita.cliente?.nome || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="font-medium text-emerald-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receita.valor)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={STATUS_FINANCEIRO_COLORS[receita.status]}
                  >
                    {STATUS_FINANCEIRO_LABELS[receita.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(receita.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
                      {receita.status === 'pendente' && (
                        <DropdownMenuItem onClick={() => handleMarcarPaga(receita.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Paga
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/financeiro/receitas/${receita.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(receita.id)}
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
