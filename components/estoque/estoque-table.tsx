'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Pencil, Trash2, Plus, Minus, Eye, History, QrCode } from 'lucide-react'
import type { ItemEstoque } from '@/lib/types'
import { deleteItemEstoque } from '@/app/dashboard/estoque/actions'
import { toast } from 'sonner'

interface EstoqueTableProps {
  itens: ItemEstoque[]
}

export function EstoqueTable({ itens }: EstoqueTableProps) {
  const router = useRouter()

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o item "${nome}"?`)) {
      return
    }

    const result = await deleteItemEstoque(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Item excluído com sucesso!')
      router.refresh()
    }
  }

  function getQuantidadeStatus(item: ItemEstoque) {
    if (item.quantidade <= 0) {
      return { label: 'Sem Estoque', className: 'bg-red-500/20 text-red-400' }
    }
    if (item.quantidade <= item.quantidade_minima) {
      return { label: 'Baixo', className: 'bg-yellow-500/20 text-yellow-400' }
    }
    return { label: 'OK', className: 'bg-green-500/20 text-green-400' }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Venda</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => {
              const status = getQuantidadeStatus(item)
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <Link 
                        href={`/dashboard/estoque/${item.id}`}
                        className="font-medium hover:text-emerald-500 transition-colors"
                      >
                        {item.nome}
                      </Link>
                      {item.marca && item.modelo && (
                        <span className="text-muted-foreground text-sm block">
                          {item.marca} {item.modelo}
                        </span>
                      )}
                      {item.descricao && !item.marca && (
                        <span className="text-muted-foreground text-sm block truncate max-w-[200px]">
                          {item.descricao}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.codigo || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {item.categoria || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">{item.quantidade}</span>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_custo)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_venda)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/estoque/${item.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/estoque/${item.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/estoque/${item.id}/movimentar`}>
                            <History className="mr-2 h-4 w-4" />
                            Movimentar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/estoque/${item.id}?tab=qrcode`}>
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Code
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(item.id, item.nome)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
