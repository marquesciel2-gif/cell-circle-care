import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useRepairs } from "@/hooks/useRepairs";
import { useAccounts } from "@/hooks/useAccounts";
import { useMemo } from "react";
import { Phone, Mail, MapPin, Wrench, Receipt, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
  fallbackName?: string;
}

export function ClientDetailDrawer({ open, onClose, clientId, fallbackName }: ClientDetailDrawerProps) {
  const { clients } = useClients();
  const { repairs } = useRepairs();
  const { accounts } = useAccounts();

  const client = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clients, clientId]
  );

  // Filtra por client_id se houver, senão por nome (legado)
  const matchKey = clientId
    ? (it: { client_id: string | null; client_name: string }) => it.client_id === clientId
    : (it: { client_id: string | null; client_name: string }) => it.client_name === fallbackName;

  const clientRepairs = repairs.filter(matchKey);
  const clientAccounts = accounts.filter(matchKey);

  const totals = useMemo(() => {
    const pago = clientAccounts.reduce((s, a) => s + Number(a.valor_pago || 0), 0);
    const total = clientAccounts.reduce((s, a) => s + Number(a.valor_total || 0), 0);
    return { pago, pendente: total - pago, total };
  }, [clientAccounts]);

  const displayName = client?.nome || fallbackName || "Cliente";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 text-sm">
          {client?.telefone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{client.telefone}</span>
            </div>
          )}
          {client?.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{client.email}</span>
            </div>
          )}
          {client?.endereco && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{client.endereco}</span>
            </div>
          )}
          {!client && (
            <p className="text-xs text-muted-foreground">
              Cliente não cadastrado — exibindo registros pelo nome.
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Pago</p>
            <p className="text-sm font-bold text-success">
              R$ {totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Em aberto</p>
            <p className="text-sm font-bold text-warning">
              R$ {totals.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Serviços</p>
            <p className="text-sm font-bold text-foreground">{clientRepairs.length}</p>
          </div>
        </div>

        <Tabs defaultValue="consertos" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="consertos" className="gap-2">
              <Wrench className="h-4 w-4" /> Consertos ({clientRepairs.length})
            </TabsTrigger>
            <TabsTrigger value="contas" className="gap-2">
              <Receipt className="h-4 w-4" /> Contas ({clientAccounts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consertos" className="mt-3 space-y-2">
            {clientRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum conserto.</p>
            ) : (
              clientRepairs.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{r.device}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.problem}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      {r.value && (
                        <p className="text-sm font-bold text-foreground mt-1">
                          R$ {Number(r.value).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="contas" className="mt-3 space-y-2">
            {clientAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta.</p>
            ) : (
              clientAccounts.map((a) => {
                const restante = Number(a.valor_total) - Number(a.valor_pago);
                return (
                  <div key={a.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{a.descricao}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {a.vencimento && `Venc: ${format(new Date(a.vencimento), "dd/MM/yyyy", { locale: ptBR })}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                        <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1 justify-end">
                          <DollarSign className="h-3 w-3" />
                          {Number(a.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        {restante > 0 && (
                          <p className="text-[10px] text-warning">
                            Resta R$ {restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
