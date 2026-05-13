'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import type { StatusConserto } from '@/lib/types'
import { STATUS_CONSERTO_LABELS, STATUS_CONSERTO_COLORS } from '@/lib/types'

const statusOptions: StatusConserto[] = [
  'recebido',
  'diagnostico',
  'aguardando_aprovacao',
  'em_reparo',
  'pronto',
  'entregue',
  'cancelado',
]

interface ConsertosFiltersProps {
  searchQuery?: string
  statusFilter?: StatusConserto
}

export function ConsertosFilters({ searchQuery, statusFilter }: ConsertosFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilters(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/consertos?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    updateFilters('q', q || null)
  }

  function clearFilters() {
    router.push('/dashboard/consertos')
  }

  const hasFilters = searchQuery || statusFilter

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filtros</CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por OS, dispositivo, marca ou modelo..."
              defaultValue={searchQuery}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  statusFilter === status 
                    ? STATUS_CONSERTO_COLORS[status]
                    : 'hover:bg-accent'
                }`}
                onClick={() => updateFilters('status', statusFilter === status ? null : status)}
              >
                {STATUS_CONSERTO_LABELS[status]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
