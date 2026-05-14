'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Loader2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Cliente } from '@/lib/types'

interface RelatorioClientesProps {
  empresaId: string
}

type ClienteComConsertos = Cliente & { consertos: { id: string }[] }

export function RelatorioClientes({ empresaId }: RelatorioClientesProps) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [clientes, setClientes] = useState<ClienteComConsertos[]>([])

  async function carregarDados() {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('clientes')
      .select('*, consertos(id)')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function gerarPDF() {
    setPdfLoading(true)
    try {
      const response = await fetch(`/api/relatorios/clientes?dataInicio=2020-01-01&dataFim=2030-12-31`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-clientes.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
    setPdfLoading(false)
  }

  const clientesAtivos = clientes.filter(c => c.consertos.length > 0)
  const clientesNovos = clientes.filter(c => {
    const dataCliente = new Date(c.created_at)
    const mesAtual = new Date()
    return dataCliente.getMonth() === mesAtual.getMonth() && 
           dataCliente.getFullYear() === mesAtual.getFullYear()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{clientesAtivos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{clientesNovos.length}</div>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <Button onClick={gerarPDF} disabled={pdfLoading} variant="outline">
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Serviços</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.telefone || '-'}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell className="text-center font-medium">{cliente.consertos.length}</TableCell>
                  <TableCell>
                    {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
              {clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum cliente cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
