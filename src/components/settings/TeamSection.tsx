import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Wrench, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  roles: string[];
}

export function TeamSection() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for new member
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTecnico, setIsTecnico] = useState(false);
  const [isVendedor, setIsVendedor] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    
    // Fetch all profiles (admin can see all)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, nome");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    // Combine data
    const membersData: TeamMember[] = profiles.map((profile) => {
      const userRoles = roles?.filter((r) => r.user_id === profile.user_id).map((r) => r.role) || [];
      return {
        id: profile.id,
        user_id: profile.user_id,
        nome: profile.nome,
        email: "", // Email not stored in profiles
        roles: userRoles,
      };
    });

    setMembers(membersData);
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!isAdmin && !isTecnico && !isVendedor) {
      toast.error("Selecione pelo menos um papel");
      return;
    }

    setSaving(true);

    try {
      const roles: string[] = [];
      if (isAdmin) roles.push("admin");
      if (isTecnico) roles.push("tecnico");
      if (isVendedor) roles.push("vendedor");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await supabase.functions.invoke("create-collaborator", {
        body: { email, password, nome: nome.trim(), roles },
      });

      if (response.error) {
        let errorMsg = "Erro ao cadastrar colaborador";
        try {
          const errorBody = await (response.error as any).context?.json();
          if (errorBody?.error) errorMsg = errorBody.error;
        } catch {
          errorMsg = response.error.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const result = response.data;
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Colaborador cadastrado com sucesso!");
      setIsOpen(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Erro ao cadastrar colaborador");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    // Can't remove yourself
    if (member.user_id === user?.id) {
      toast.error("Você não pode remover a si mesmo");
      return;
    }

    try {
      // Remove all roles for this user
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id);

      if (error) throw error;

      toast.success("Colaborador removido da equipe");
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erro ao remover colaborador");
    }
  };

  const resetForm = () => {
    setNome("");
    setEmail("");
    setPassword("");
    setIsAdmin(false);
    setIsTecnico(false);
    setIsVendedor(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "tecnico":
        return <Wrench className="h-3 w-3" />;
      case "vendedor":
        return <ShoppingBag className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "tecnico":
        return "Técnico";
      case "vendedor":
        return "Vendedor";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "tecnico":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "vendedor":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipe
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground border-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Colaborador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do colaborador"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>Papéis</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="role-admin"
                      checked={isAdmin}
                      onCheckedChange={(checked) => setIsAdmin(checked === true)}
                    />
                    <label htmlFor="role-admin" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4 text-red-500" />
                      Administrador (acesso total)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="role-tecnico"
                      checked={isTecnico}
                      onCheckedChange={(checked) => setIsTecnico(checked === true)}
                    />
                    <label htmlFor="role-tecnico" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      Técnico (consertos)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="role-vendedor"
                      checked={isVendedor}
                      onCheckedChange={(checked) => setIsVendedor(checked === true)}
                    />
                    <label htmlFor="role-vendedor" className="text-sm flex items-center gap-2 cursor-pointer">
                      <ShoppingBag className="h-4 w-4 text-green-500" />
                      Vendedor (vendas e estoque)
                    </label>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum colaborador cadastrado
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{member.nome}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {member.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(role)}`}
                    >
                      {getRoleIcon(role)}
                      {getRoleLabel(role)}
                    </span>
                  ))}
                  {member.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sem papel definido</span>
                  )}
                </div>
              </div>
              {member.user_id !== user?.id && member.roles.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá todos os papéis de {member.nome}. A conta continuará existindo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemoveMember(member)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
