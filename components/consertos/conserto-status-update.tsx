'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Loader2 } from 'lucide-react'
import type { Conserto, StatusConserto } from '@/lib/types'
import { STATUS_CONSERTO_LABELS } from '@/lib/types'
import { updateConsertoStatus } from '@/app/dashboard/consertos/actions'
import { toast } from 'sonner'

interface ConsertoStatusUpdateProps {
  conserto: Conserto
}

const statusFlow: Record<StatusConserto, StatusConserto[]> = {
  recebido: ['diagnostico', 'cancelado'],
  diagnostico: ['aguardando_aprovacao', 'em_reparo', 'cancelado'],
  aguardando_aprovacao: ['em_reparo', 'cancelado'],
  em_reparo: ['pronto', 'aguardando_aprovacao', 'cancelado'],
  pronto: ['entregue', 'em_reparo'],
  entregue: [],
  cancelado: ['recebido'],
}

export function ConsertoStatusUpdate({ conserto }: ConsertoStatusUpdateProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const availableStatuses = statusFlow[conserto.status]

  async function handleStatusChange(newStatus: StatusConserto) {
    setLoading(true)
    const result = await updateConsertoStatus(conserto.id, newStatus)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Status atualizado para "${STATUS_CONSERTO_LABELS[newStatus]}"`)
      router.refresh()
    }
    setLoading(false)
  }

  if (availableStatuses.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Alterar Status
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
          >
            {STATUS_CONSERTO_LABELS[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
