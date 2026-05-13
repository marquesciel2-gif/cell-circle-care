'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Mail, Lock, User, Building2, Phone, Loader2, CheckCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cadastrar } from '../actions'

export default function CadastroPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Validar senha
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const result = await cadastrar(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      if (result.emailConfirmed) {
        // Email confirmado automaticamente, redirecionar para dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // Precisa confirmar email
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Cadastro Realizado!</h2>
                <p className="text-muted-foreground text-sm">
                  Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                </p>
                <p className="text-muted-foreground text-xs">
                  Verifique também a pasta de spam.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    Voltar para o Login
                  </Button>
                </Link>
                <Link href="/auth/confirmar-email" className="w-full">
                  <Button variant="outline" className="w-full">
                    Reenviar E-mail de Confirmação
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Smart Cell</span>
          </div>
          <p className="text-muted-foreground text-sm">Sistema de Gestão para Assistências Técnicas</p>
        </div>

        {/* Card de Cadastro */}
        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">
              Cadastre sua empresa e comece a usar o Smart Cell
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              {/* Dados da Empresa */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dados da Empresa</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nomeEmpresa"
                      name="nomeEmpresa"
                      type="text"
                      placeholder="Nome da sua assistência"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Usuário */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Dados do Administrador</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nome">Seu Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cpfCnpj"
                      name="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Repita a senha"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link 
                href="/auth/login" 
                className="text-emerald-500 hover:text-emerald-400 font-medium"
              >
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao criar sua conta, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  )
}
