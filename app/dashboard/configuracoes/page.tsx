import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, User, CreditCard, Mail, Phone, MapPin } from 'lucide-react'
import { PLANO_LABELS, STATUS_EMPRESA_LABELS, STATUS_EMPRESA_COLORS } from '@/lib/types'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()

  const empresa = usuario?.empresa

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e empresa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresa
            </CardTitle>
            <CardDescription>Informações da sua assistência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{empresa?.nome || '-'}</p>
            </div>
            {empresa?.cnpj && (
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium">{empresa.cnpj}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{empresa?.email || '-'}</span>
            </div>
            {empresa?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{empresa.telefone}</span>
              </div>
            )}
            {empresa?.endereco && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{empresa.endereco}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plano
            </CardTitle>
            <CardDescription>Informações do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Plano Atual:</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                {empresa?.plano ? PLANO_LABELS[empresa.plano] : 'Básico'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge 
                variant="secondary" 
                className={empresa?.status ? STATUS_EMPRESA_COLORS[empresa.status] : 'bg-green-500/20 text-green-400'}
              >
                {empresa?.status ? STATUS_EMPRESA_LABELS[empresa.status] : 'Ativo'}
              </Badge>
            </div>
            {empresa?.data_vencimento && (
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="font-medium">
                  {new Date(empresa.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Minha Conta
            </CardTitle>
            <CardDescription>Suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{usuario?.nome || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{usuario?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{usuario?.cargo || 'Funcionário'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Acesso</p>
                <Badge variant="secondary">
                  {usuario?.is_admin ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
