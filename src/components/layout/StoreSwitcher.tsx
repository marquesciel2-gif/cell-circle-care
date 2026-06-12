import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Store, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function StoreSwitcher() {
  const { user } = useAuth();
  const { tenantId, loading } = useTenant();
  const { allowed: multiStore } = useFeatureGate("multi_store");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: stores = [] } = useQuery({
    queryKey: ["my-stores", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: members } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id);
      const ids = (members ?? []).map((m: any) => m.tenant_id);
      if (ids.length === 0) return [];
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, nome, plano, owner_id")
        .in("id", ids);
      return tenants ?? [];
    },
    enabled: !!user,
  });

  const current = stores.find((s: any) => s.id === tenantId);

  const handleSwitch = async (id: string) => {
    if (id === tenantId) {
      setOpen(false);
      return;
    }
    const { error } = await supabase.rpc("switch_active_tenant", { _tenant_id: id });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    await queryClient.invalidateQueries();
    toast({ title: "Loja alterada", description: "Recarregando dados..." });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_additional_tenant", {
      _nome: newName.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Não foi possível criar a loja", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    setCreateOpen(false);
    await queryClient.invalidateQueries();
    toast({ title: "Loja criada!", description: "Você já está na nova loja." });
  };

  if (loading || !tenantId) return null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[220px]">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate">{current?.nome ?? "Loja"}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Suas lojas
          </div>
          <div className="max-h-64 overflow-y-auto">
            {stores.map((s: any) => (
              <button
                key={s.id}
                onClick={() => handleSwitch(s.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent text-left"
              >
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{s.nome}</span>
                {s.id === tenantId && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
          <div className="border-t my-1" />
          <button
            onClick={() => {
              setOpen(false);
              if (multiStore) setCreateOpen(true);
              else
                toast({
                  title: "Disponível no plano Business",
                  description: "Faça upgrade para criar mais lojas.",
                });
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent text-left",
              !multiStore && "text-muted-foreground"
            )}
          >
            {multiStore ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span>Nova loja</span>
            {!multiStore && (
              <span className="ml-auto text-[10px] uppercase tracking-wide">Business</span>
            )}
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova loja</DialogTitle>
            <DialogDescription>
              Cada loja tem estoque, clientes e financeiro isolados. Você poderá
              alternar entre elas a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="store-name">Nome da loja</Label>
            <Input
              id="store-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Filial Centro"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !newName.trim()}>
              {submitting ? "Criando..." : "Criar loja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
