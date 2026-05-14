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
import { 
  Pencil, 
  Trash2, 
  DollarSign, 
  Plus, 
  FileText,
  Loader2
} from 'lucide-react'
import type { Receita, Cliente, Conserto } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import { deleteReceita, marcarReceitaPaga } from '@/app/dashboard/financeiro/actions'
import { toast } from 'sonner'

interface ReceitasTableProps {
  receitas: (Receita & { cliente: Pick<Cliente, 'nome'> | null; conserto: Pick<Conserto, 'numero'> | null })[]
}

export function ReceitasTable({ receitas }: ReceitasTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null)
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
      return
    }

    setLoadingId(id)
    const result = await deleteReceita(id)
    setLoadingId(null)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Receita excluída com sucesso!')
      router.refresh()
    }
  }

  async function handleTogglePago(receita: Receita) {
    if (receita.status === 'pago') {
      // Já está pago, não faz nada ou poderia reverter
      toast.info('Esta receita já foi paga')
      return
    }
    
    // Abrir dialog para escolher data de pagamento
    setSelectedReceita(receita)
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'))
    setDialogOpen(true)
  }

  async function confirmarPagamento() {
    if (!selectedReceita) return
    
    setLoadingId(selectedReceita.id)
    setDialogOpen(false)
    
    const result = await marcarReceitaPaga(selectedReceita.id, dataPagamento)
    setLoadingId(null)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Receita marcada como paga!')
      router.refresh()
    }
    
    setSelectedReceita(null)
  }

  async function gerarReciboPDF(receita: Receita & { cliente: Pick<Cliente, 'nome'> | null }) {
    setPdfLoading(receita.id)
    try {
      const response = await fetch(`/api/relatorios/recibo/${receita.id}`)
      if (!response.ok) throw new Error('Erro ao gerar recibo')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${receita.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Recibo gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar recibo')
    }
    setPdfLoading(null)
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
    <>
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
                <TableHead className="text-center">Pago</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
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
                    <div className="text-sm">
                      <div>{format(new Date(receita.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                      {receita.data_pagamento && (
                        <div className="text-emerald-500 text-xs">
                          Pago: {format(new Date(receita.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {loadingId === receita.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Switch
                        checked={receita.status === 'pago'}
                        onCheckedChange={() => handleTogglePago(receita)}
                        disabled={receita.status === 'pago'}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {receita.status === 'pago' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => gerarReciboPDF(receita)}
                          disabled={pdfLoading === receita.id}
                          title="Gerar Recibo PDF"
                        >
                          {pdfLoading === receita.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Editar"
                      >
                        <Link href={`/dashboard/financeiro/receitas/${receita.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(receita.id)}
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
              Informe a data em que o pagamento foi recebido.
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
