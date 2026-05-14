'use client'

import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, TrendingDown, Plus, Loader2 } from 'lucide-react'
import type { Despesa } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import { deleteDespesa, marcarDespesaPaga } from '@/app/dashboard/financeiro/actions'
import { toast } from 'sonner'

interface DespesasTableProps {
  despesas: Despesa[]
}

export function DespesasTable({ despesas }: DespesasTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null)
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'))

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return
    }

    setLoadingId(id)
    const result = await deleteDespesa(id)
    setLoadingId(null)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Despesa excluída com sucesso!')
      router.refresh()
    }
  }

  async function handleTogglePago(despesa: Despesa) {
    if (despesa.status === 'pago') {
      toast.info('Esta despesa já foi paga')
      return
    }
    
    setSelectedDespesa(despesa)
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'))
    setDialogOpen(true)
  }

  async function confirmarPagamento() {
    if (!selectedDespesa) return
    
    setLoadingId(selectedDespesa.id)
    setDialogOpen(false)
    
    const result = await marcarDespesaPaga(selectedDespesa.id, dataPagamento)
    setLoadingId(null)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Despesa marcada como paga!')
      router.refresh()
    }
    
    setSelectedDespesa(null)
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
    <>
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
                <TableHead className="text-center">Pago</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
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
                    <div className="text-sm">
                      <div>{format(new Date(despesa.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                      {despesa.data_pagamento && (
                        <div className="text-emerald-500 text-xs">
                          Pago: {format(new Date(despesa.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {loadingId === despesa.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Switch
                        checked={despesa.status === 'pago'}
                        onCheckedChange={() => handleTogglePago(despesa)}
                        disabled={despesa.status === 'pago'}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Editar"
                      >
                        <Link href={`/dashboard/financeiro/despesas/${despesa.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(despesa.id)}
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para escolher data de pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Informe a data em que a despesa foi paga.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="data_pagamento">Data do Pagamento</Label>
            <Input
              id="data_pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPagamento} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
