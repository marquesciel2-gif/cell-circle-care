'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Smartphone, User, Wrench } from 'lucide-react'
import type { Cliente, Conserto, StatusConserto } from '@/lib/types'
import { STATUS_CONSERTO_LABELS } from '@/lib/types'
import { createConserto, updateConserto } from '@/app/dashboard/consertos/actions'

interface ConsertoFormProps {
  conserto?: Conserto
  clientes: Pick<Cliente, 'id' | 'nome' | 'telefone'>[]
  clienteSelecionado?: Cliente | null
}

const statusOptions: StatusConserto[] = [
  'recebido',
  'diagnostico',
  'aguardando_aprovacao',
  'em_reparo',
  'pronto',
  'entregue',
  'cancelado',
]

const prioridadeOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export function ConsertoForm({ conserto, clientes, clienteSelecionado }: ConsertoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = conserto 
      ? await updateConserto(conserto.id, formData)
      : await createConserto(formData)

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

      {/* Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cliente
          </CardTitle>
          <CardDescription>Selecione o cliente para esta ordem de serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente</Label>
            <Select 
              name="cliente_id" 
              defaultValue={conserto?.cliente_id || clienteSelecionado?.id || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} {cliente.telefone && `- ${cliente.telefone}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Dispositivo
          </CardTitle>
          <CardDescription>Informações sobre o aparelho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dispositivo">Tipo de Dispositivo *</Label>
              <Input
                id="dispositivo"
                name="dispositivo"
                required
                defaultValue={conserto?.dispositivo}
                placeholder="Ex: Celular, Tablet, Notebook..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                name="marca"
                defaultValue={conserto?.marca || ''}
                placeholder="Ex: Samsung, Apple, Motorola..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                name="modelo"
                defaultValue={conserto?.modelo || ''}
                placeholder="Ex: Galaxy S23, iPhone 15..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                name="cor"
                defaultValue={conserto?.cor || ''}
                placeholder="Ex: Preto, Branco, Azul..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                name="imei"
                defaultValue={conserto?.imei || ''}
                placeholder="IMEI do dispositivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha_dispositivo">Senha do Dispositivo</Label>
              <Input
                id="senha_dispositivo"
                name="senha_dispositivo"
                defaultValue={conserto?.senha_dispositivo || ''}
                placeholder="Senha para desbloquear"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acessorios">Acessórios</Label>
            <Input
              id="acessorios"
              name="acessorios"
              defaultValue={conserto?.acessorios || ''}
              placeholder="Ex: Carregador, capinha, película..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Problema e Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Problema e Serviço
          </CardTitle>
          <CardDescription>Descreva o problema e informações do reparo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="problema">Problema Relatado *</Label>
            <Textarea
              id="problema"
              name="problema"
              required
              defaultValue={conserto?.problema}
              placeholder="Descreva o problema informado pelo cliente..."
              rows={3}
            />
          </div>

          {conserto && (
            <>
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  name="diagnostico"
                  defaultValue={conserto.diagnostico || ''}
                  placeholder="Diagnóstico técnico do problema..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solucao">Solução Aplicada</Label>
                <Textarea
                  id="solucao"
                  name="solucao"
                  defaultValue={conserto.solucao || ''}
                  placeholder="Descreva a solução aplicada..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="valor_pecas">Valor das Peças (R$)</Label>
                  <Input
                    id="valor_pecas"
                    name="valor_pecas"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={conserto.valor_pecas || 0}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_mao_obra">Mão de Obra (R$)</Label>
                  <Input
                    id="valor_mao_obra"
                    name="valor_mao_obra"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={conserto.valor_mao_obra || 0}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={conserto.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_CONSERTO_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select name="prioridade" defaultValue={conserto?.prioridade || 'normal'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prioridadeOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tecnico_responsavel">Técnico Responsável</Label>
              <Input
                id="tecnico_responsavel"
                name="tecnico_responsavel"
                defaultValue={conserto?.tecnico_responsavel || ''}
                placeholder="Nome do técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_previsao">Previsão de Entrega</Label>
              <Input
                id="data_previsao"
                name="data_previsao"
                type="date"
                defaultValue={conserto?.data_previsao?.split('T')[0] || ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={conserto?.observacoes || ''}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
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
          ) : conserto ? (
            'Atualizar Conserto'
          ) : (
            'Cadastrar Conserto'
          )}
        </Button>
      </div>
    </form>
  )
}
