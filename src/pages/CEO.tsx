import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type Tenant = {
  id: string;
  nome: string;
  owner_id: string;
  plano: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  admin_blocked: boolean;
  onboarded: boolean;
  created_at: string;
};

type MemberRow = {
  id: string;
  user_id: string;
  tenant_id: string;
};

type RoleRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "admin" | "tecnico" | "vendedor";
};

type ProfileRow = {
  user_id: string;
  nome: string;
};

const ROLE_OPTIONS: RoleRow["role"][] = ["admin", "tecnico", "vendedor"];

export default function CEO() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin, loading } = useTenant();
  const qc = useQueryClient();
  const [openTenant, setOpenTenant] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["ceo-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tenant[];
    },
    enabled: isSuperAdmin,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["ceo-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("id, user_id, tenant_id");
      if (error) throw error;
      return (data ?? []) as MemberRow[];
    },
    enabled: isSuperAdmin,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["ceo-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome");
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
    enabled: isSuperAdmin,
  });

  const { data: roles = [], refetch: refetchRoles } = useQuery({
    queryKey: ["ceo-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, tenant_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
    enabled: isSuperAdmin,
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.user_id, p.nome));
    return m;
  }, [profiles]);

  const totals = useMemo(() => {
    const uniqueUsers = new Set(members.map((m) => m.user_id));
    const active = tenants.filter(
      (t) => !t.admin_blocked && ["active", "trialing"].includes(t.status)
    ).length;
    return { stores: tenants.length, users: uniqueUsers.size, active };
  }, [tenants, members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) => t.nome.toLowerCase().includes(q));
  }, [tenants, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/app/dashboard" replace />;

  const toggleBlock = async (t: Tenant) => {
    const { error } = await supabase
      .from("tenants")
      .update({ admin_blocked: !t.admin_blocked })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(t.admin_blocked ? "Loja liberada" : "Loja bloqueada");
    qc.invalidateQueries({ queryKey: ["ceo-tenants"] });
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Painel CEO
              </h1>
              <p className="text-sm text-muted-foreground">
                Visão geral de todas as lojas da plataforma.
              </p>
            </div>
          </div>
          <Badge variant="secondary">{user.email}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Lojas cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totals.stores}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totals.users}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Lojas com acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totals.active}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Lojas</CardTitle>
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trial até</TableHead>
                      <TableHead>Próxima cobrança</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const memberCount = members.filter((m) => m.tenant_id === t.id).length;
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="font-medium">{t.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {memberCount} usuário(s)
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase">
                              {t.plano}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {t.admin_blocked ? (
                              <Badge variant="destructive">Bloqueada</Badge>
                            ) : (
                              <Badge
                                variant={
                                  ["active", "trialing"].includes(t.status)
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {t.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {t.trial_ends_at
                              ? new Date(t.trial_ends_at).toLocaleDateString("pt-BR")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {t.current_period_end
                              ? new Date(t.current_period_end).toLocaleDateString("pt-BR")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenTenant(t)}
                            >
                              Gerenciar
                            </Button>
                            <Button
                              variant={t.admin_blocked ? "default" : "destructive"}
                              size="sm"
                              onClick={() => toggleBlock(t)}
                            >
                              <LockKeyhole className="h-4 w-4 mr-1" />
                              {t.admin_blocked ? "Liberar" : "Bloquear"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma loja encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <TenantMembersDialog
          tenant={openTenant}
          onClose={() => setOpenTenant(null)}
          members={members.filter((m) => m.tenant_id === openTenant?.id)}
          roles={roles.filter((r) => r.tenant_id === openTenant?.id)}
          profileMap={profileMap}
          onChange={async () => {
            await refetchRoles();
          }}
        />
      </div>
    </div>
  );
}

function TenantMembersDialog({
  tenant,
  onClose,
  members,
  roles,
  profileMap,
  onChange,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  members: MemberRow[];
  roles: RoleRow[];
  profileMap: Map<string, string>;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  if (!tenant) return null;

  const rolesByUser = new Map<string, RoleRow[]>();
  roles.forEach((r) => {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r);
    rolesByUser.set(r.user_id, list);
  });

  const setRole = async (userId: string, newRole: RoleRow["role"]) => {
    setBusy(userId);
    try {
      const existing = rolesByUser.get(userId) ?? [];
      // Remove all existing roles for this tenant/user, then insert the new one
      if (existing.length > 0) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .in(
            "id",
            existing.map((r) => r.id)
          );
        if (error) throw error;
      }
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        tenant_id: tenant.id,
        role: newRole,
      });
      if (error) throw error;
      toast.success("Permissão atualizada");
      await onChange();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar permissão");
    } finally {
      setBusy(null);
    }
  };

  const removeAccess = async (userId: string) => {
    setBusy(userId);
    try {
      const existing = rolesByUser.get(userId) ?? [];
      if (existing.length > 0) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .in(
            "id",
            existing.map((r) => r.id)
          );
        if (error) throw error;
      }
      toast.success("Acesso removido");
      await onChange();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover acesso");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tenant.nome} — colaboradores</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum colaborador cadastrado.
            </p>
          )}
          {members.map((m) => {
            const userRoles = rolesByUser.get(m.user_id) ?? [];
            const currentRole = userRoles[0]?.role ?? "";
            const isOwner = m.user_id === tenant.owner_id;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    {profileMap.get(m.user_id) ?? m.user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isOwner ? "Dono da loja" : "Colaborador"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={currentRole}
                    onValueChange={(v) => setRole(m.user_id, v as RoleRow["role"])}
                    disabled={busy === m.user_id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sem permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAccess(m.user_id)}
                      disabled={busy === m.user_id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
