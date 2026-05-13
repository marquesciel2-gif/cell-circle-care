'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Despesa, StatusFinanceiro } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS } from '@/lib/types'
import { createDespesa, updateDespesa } from '@/app/dashboard/financeiro/actions'

interface DespesaFormProps {
  despesa?: Despesa
}

const statusOptions: StatusFinanceiro[] = ['pendente', 'pago', 'atrasado', 'cancelado']

export function DespesaForm({ despesa }: DespesaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = despesa 
      ? await updateDespesa(despesa.id, formData)
      : await createDespesa(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            name="descricao"
            required
            defaultValue={despesa?.descricao}
            placeholder="Descrição da despesa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={despesa?.valor}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Select name="categoria" defaultValue={despesa?.categoria || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aluguel">Aluguel</SelectItem>
              <SelectItem value="energia">Energia</SelectItem>
              <SelectItem value="internet">Internet</SelectItem>
              <SelectItem value="salarios">Salários</SelectItem>
              <SelectItem value="fornecedores">Fornecedores</SelectItem>
              <SelectItem value="impostos">Impostos</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fornecedor">Fornecedor</Label>
          <Input
            id="fornecedor"
            name="fornecedor"
            defaultValue={despesa?.fornecedor || ''}
            placeholder="Nome do fornecedor"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de Vencimento</Label>
          <Input
            id="data_vencimento"
            name="data_vencimento"
            type="date"
            defaultValue={despesa?.data_vencimento || ''}
          />
        </div>

        {despesa && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={despesa.status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_FINANCEIRO_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          defaultValue={despesa?.observacoes || ''}
          placeholder="Observações adicionais..."
          rows={2}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : despesa ? (
            'Atualizar Despesa'
          ) : (
            'Cadastrar Despesa'
          )}
        </Button>
      </div>
    </form>
  )
}
