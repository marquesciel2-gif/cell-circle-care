'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { ItemEstoque } from '@/lib/types'
import { STATUS_PRODUTO_LABELS, type StatusProduto } from '@/lib/types'
import { createItemEstoque, updateItemEstoque } from '@/app/dashboard/estoque/actions'

interface EstoqueFormProps {
  item?: ItemEstoque
}

export function EstoqueForm({ item }: EstoqueFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = item 
      ? await updateItemEstoque(item.id, formData)
      : await createItemEstoque(formData)

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

      {/* Dados Basicos */}
      <div>
        <h3 className="font-medium mb-4">Dados Basicos</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={item?.nome}
              placeholder="Nome do item"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Codigo</Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={item?.codigo || ''}
              placeholder="Codigo do produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              name="categoria"
              defaultValue={item?.categoria || ''}
              placeholder="Ex: Tela, Bateria, Conector..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              name="marca"
              defaultValue={item?.marca || ''}
              placeholder="Ex: Samsung, Apple..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              name="modelo"
              defaultValue={item?.modelo || ''}
              placeholder="Ex: Galaxy S21, iPhone 13..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              name="fornecedor"
              defaultValue={item?.fornecedor || ''}
              placeholder="Nome do fornecedor"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Identificadores para Rastreabilidade */}
      <div>
        <h3 className="font-medium mb-4">Identificadores (Rastreabilidade)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="numero_serie">Numero de Serie</Label>
            <Input
              id="numero_serie"
              name="numero_serie"
              defaultValue={item?.numero_serie || ''}
              placeholder="Ex: SN123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei">IMEI</Label>
            <Input
              id="imei"
              name="imei"
              defaultValue={item?.imei || ''}
              placeholder="Ex: 353456789012345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_barras">Codigo de Barras</Label>
            <Input
              id="codigo_barras"
              name="codigo_barras"
              defaultValue={item?.codigo_barras || ''}
              placeholder="Ex: 7891234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="garantia_meses">Garantia (meses)</Label>
            <Input
              id="garantia_meses"
              name="garantia_meses"
              type="number"
              min="0"
              defaultValue={item?.garantia_meses || 0}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Estoque e Precos */}
      <div>
        <h3 className="font-medium mb-4">Estoque e Precos</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {!item && (
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade Inicial</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="0"
                defaultValue={0}
                placeholder="0"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantidade_minima">Quantidade Minima</Label>
            <Input
              id="quantidade_minima"
              name="quantidade_minima"
              type="number"
              min="0"
              defaultValue={item?.quantidade_minima || 5}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco_custo">Preco de Custo (R$)</Label>
            <Input
              id="preco_custo"
              name="preco_custo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.preco_custo || 0}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco_venda">Preco de Venda (R$)</Label>
            <Input
              id="preco_venda"
              name="preco_venda"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.preco_venda || 0}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao">Localizacao</Label>
            <Input
              id="localizacao"
              name="localizacao"
              defaultValue={item?.localizacao || ''}
              placeholder="Ex: Prateleira A1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_entrada">Data de Entrada</Label>
            <Input
              id="data_entrada"
              name="data_entrada"
              type="date"
              defaultValue={item?.data_entrada || new Date().toISOString().split('T')[0]}
            />
          </div>

          {item && (
            <div className="space-y-2">
              <Label htmlFor="status_produto">Status</Label>
              <Select name="status_produto" defaultValue={item.status_produto || 'em_estoque'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_PRODUTO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Descricao */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descricao</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={item?.descricao || ''}
          placeholder="Descricao detalhada do item..."
          rows={3}
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
          ) : item ? (
            'Atualizar Item'
          ) : (
            'Cadastrar Item'
          )}
        </Button>
      </div>
    </form>
  )
}
