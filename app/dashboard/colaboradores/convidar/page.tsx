'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const CARGOS = [
  { value: 'tecnico', label: 'Técnico', description: 'Realiza consertos e reparos' },
  { value: 'atendente', label: 'Atendente', description: 'Atendimento ao cliente e recepção' },
  { value: 'gerente', label: 'Gerente', description: 'Gerencia a equipe e operações' },
  { value: 'financeiro', label: 'Financeiro', description: 'Controle financeiro e relatórios' },
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
]

export default function ConvidarColaboradorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('tecnico')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email) {
      toast.error('Informe o email do colaborador')
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch('/api/colaboradores/convidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cargo_tipo: cargo }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar convite')
      }
      
      toast.success('Convite enviado com sucesso!')
      router.push('/dashboard/colaboradores')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar convite')
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/colaboradores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Convidar Colaborador</h1>
          <p className="text-muted-foreground">
            Envie um convite por email para adicionar um novo membro à equipe
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Novo Convite
          </CardTitle>
          <CardDescription>
            O colaborador receberá um email com instruções para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Colaborador</Label>
              <Input
                id="email"
                type="email"
                placeholder="colaborador@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Função</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div>
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/dashboard/colaboradores">Cancelar</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar Convite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
