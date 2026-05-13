'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import type { ItemEstoque } from '@/lib/types'
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
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            name="codigo"
            defaultValue={item?.codigo || ''}
            placeholder="Código do produto"
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
          <Label htmlFor="fornecedor">Fornecedor</Label>
          <Input
            id="fornecedor"
            name="fornecedor"
            defaultValue={item?.fornecedor || ''}
            placeholder="Nome do fornecedor"
          />
        </div>

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
          <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
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
          <Label htmlFor="preco_custo">Preço de Custo (R$)</Label>
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
          <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
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
          <Label htmlFor="localizacao">Localização</Label>
          <Input
            id="localizacao"
            name="localizacao"
            defaultValue={item?.localizacao || ''}
            placeholder="Ex: Prateleira A1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={item?.descricao || ''}
          placeholder="Descrição detalhada do item..."
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
