'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, Loader2, Mail, Clock, Shield, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string | null
  cargo_tipo: string | null
  is_admin: boolean
  ativo: boolean
  telefone: string | null
  comissao_percentual: number | null
  data_admissao: string | null
  created_at: string
}

interface Convite {
  id: string
  email: string
  cargo_tipo: string
  expira_em: string
  created_at: string
}

interface ColaboradoresTableProps {
  colaboradores: Usuario[]
  convites: Convite[]
  isAdmin: boolean
  currentUserId: string
}

const CARGO_LABELS: Record<string, string> = {
  tecnico: 'Técnico',
  atendente: 'Atendente',
  gerente: 'Gerente',
  financeiro: 'Financeiro',
  admin: 'Administrador',
}

const CARGO_COLORS: Record<string, string> = {
  tecnico: 'bg-blue-500/20 text-blue-400',
  atendente: 'bg-purple-500/20 text-purple-400',
  gerente: 'bg-amber-500/20 text-amber-400',
  financeiro: 'bg-emerald-500/20 text-emerald-400',
  admin: 'bg-red-500/20 text-red-400',
}

export function ColaboradoresTable({ colaboradores, convites, isAdmin, currentUserId }: ColaboradoresTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; nome: string }>({ open: false, id: '', nome: '' })

  async function toggleAtivo(id: string, ativo: boolean) {
    setLoading(id)
    try {
      const res = await fetch(`/api/colaboradores/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      
      if (!res.ok) throw new Error()
      
      toast.success(ativo ? 'Colaborador desativado' : 'Colaborador ativado')
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar colaborador')
    }
    setLoading(null)
  }

  async function handleDelete() {
    setLoading(deleteDialog.id)
    setDeleteDialog({ open: false, id: '', nome: '' })
    
    try {
      const res = await fetch(`/api/colaboradores/${deleteDialog.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error()
      
      toast.success('Colaborador removido')
      router.refresh()
    } catch {
      toast.error('Erro ao remover colaborador')
    }
    setLoading(null)
  }

  async function cancelarConvite(id: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/colaboradores/convites/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error()
      
      toast.success('Convite cancelado')
      router.refresh()
    } catch {
      toast.error('Erro ao cancelar convite')
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Convites Pendentes */}
      {convites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convites.map((convite) => (
                  <TableRow key={convite.id}>
                    <TableCell className="font-medium">{convite.email}</TableCell>
                    <TableCell>
                      <Badge className={CARGO_COLORS[convite.cargo_tipo] || 'bg-zinc-500/20 text-zinc-400'}>
                        {CARGO_LABELS[convite.cargo_tipo] || convite.cargo_tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(convite.expira_em), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelarConvite(convite.id)}
                          disabled={loading === convite.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {loading === convite.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((colab) => (
                <TableRow key={colab.id} className={!colab.ativo ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{colab.nome}</span>
                      {colab.is_admin && (
                        <Shield className="h-4 w-4 text-amber-500" title="Administrador" />
                      )}
                      {colab.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">Você</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={CARGO_COLORS[colab.cargo_tipo || ''] || 'bg-zinc-500/20 text-zinc-400'}>
                      {CARGO_LABELS[colab.cargo_tipo || ''] || colab.cargo || 'Não definido'}
                    </Badge>
                  </TableCell>
                  <TableCell>{colab.email}</TableCell>
                  <TableCell>{colab.telefone || '-'}</TableCell>
                  <TableCell className="text-center">
                    {loading === colab.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <Switch
                        checked={colab.ativo}
                        onCheckedChange={() => toggleAtivo(colab.id, colab.ativo)}
                        disabled={!isAdmin || colab.id === currentUserId}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isAdmin && colab.id !== currentUserId && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/dashboard/colaboradores/${colab.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ open: true, id: colab.id, nome: colab.nome })}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {colaboradores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum colaborador cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteDialog.nome}</strong> da equipe? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
