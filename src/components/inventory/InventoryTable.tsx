import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: number;
  nome: string;
  marca: string;
  modelo: string;
  preco: number;
  quantidade: number;
  status: "disponivel" | "reservado" | "vendido";
  condicao: "novo" | "usado" | "seminovo";
}

interface InventoryTableProps {
  title: string;
  type: "novos" | "usados" | "acessorios";
}

const mockData: Record<string, InventoryItem[]> = {
  novos: [
    { id: 1, nome: "iPhone 15 Pro", marca: "Apple", modelo: "128GB", preco: 6999, quantidade: 3, status: "disponivel", condicao: "novo" },
    { id: 2, nome: "Galaxy S24 Ultra", marca: "Samsung", modelo: "256GB", preco: 7499, quantidade: 2, status: "disponivel", condicao: "novo" },
    { id: 3, nome: "Xiaomi 14", marca: "Xiaomi", modelo: "256GB", preco: 4299, quantidade: 5, status: "disponivel", condicao: "novo" },
    { id: 4, nome: "Moto G84", marca: "Motorola", modelo: "128GB", preco: 1799, quantidade: 8, status: "disponivel", condicao: "novo" },
  ],
  usados: [
    { id: 5, nome: "iPhone 12", marca: "Apple", modelo: "64GB", preco: 2499, quantidade: 2, status: "disponivel", condicao: "seminovo" },
    { id: 6, nome: "Galaxy S21", marca: "Samsung", modelo: "128GB", preco: 1899, quantidade: 1, status: "reservado", condicao: "usado" },
    { id: 7, nome: "Redmi Note 11", marca: "Xiaomi", modelo: "64GB", preco: 799, quantidade: 4, status: "disponivel", condicao: "usado" },
  ],
  acessorios: [
    { id: 8, nome: "Carregador Turbo 30W", marca: "Samsung", modelo: "USB-C", preco: 149, quantidade: 15, status: "disponivel", condicao: "novo" },
    { id: 9, nome: "Fone Bluetooth", marca: "JBL", modelo: "Tune 510", preco: 249, quantidade: 8, status: "disponivel", condicao: "novo" },
    { id: 10, nome: "Capa Silicone iPhone 15", marca: "Apple", modelo: "Original", preco: 299, quantidade: 12, status: "disponivel", condicao: "novo" },
    { id: 11, nome: "Película 3D Galaxy S24", marca: "Genérica", modelo: "Vidro", preco: 39, quantidade: 25, status: "disponivel", condicao: "novo" },
  ],
};

const statusStyles = {
  disponivel: "bg-success/10 text-success border-success/20",
  reservado: "bg-warning/10 text-warning border-warning/20",
  vendido: "bg-muted text-muted-foreground border-muted",
};

const statusLabels = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
};

export function InventoryTable({ title, type }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const items = mockData[type] || [];

  const filteredItems = items.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button className="gradient-primary text-primary-foreground border-0">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Marca</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Modelo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Preço</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Qtd</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{item.nome}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.marca}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.modelo}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    R$ {item.preco.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantidade}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", statusStyles[item.status])}
                    >
                      {statusLabels[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredItems.length} de {items.length} itens</span>
      </div>
    </div>
  );
}
