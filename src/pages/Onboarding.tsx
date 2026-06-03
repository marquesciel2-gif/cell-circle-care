import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant, onboarded, loading, refetch } = useTenant();
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && tenant && onboarded) {
      navigate("/app/dashboard", { replace: true });
    }
    if (tenant && !nome) setNome(tenant.nome);
  }, [loading, tenant, onboarded, navigate, nome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Digite o nome da sua loja");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      let tenantId = tenant?.id;

      if (!tenantId) {
        // Fallback: create tenant manually (trigger should normally handle this)
        const { data: created, error: createErr } = await supabase
          .from("tenants")
          .insert({
            nome: nome.trim(),
            owner_id: user.id,
            plano: "trial",
            status: "trialing",
            trial_ends_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
            onboarded: true,
          })
          .select()
          .single();
        if (createErr) throw createErr;
        tenantId = created.id;

        await supabase.from("tenant_members").insert({ tenant_id: tenantId, user_id: user.id });
        await supabase.from("user_roles").insert({ user_id: user.id, role: "admin", tenant_id: tenantId });
      } else {
        const { error } = await supabase
          .from("tenants")
          .update({ nome: nome.trim(), onboarded: true })
          .eq("id", tenantId);
        if (error) throw error;
      }

      await refetch();
      toast.success("Loja configurada! Bem-vindo 🎉");
      navigate("/app/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error("Erro ao configurar loja");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Antes de começar, qual o nome da sua loja?
            <br />
            <span className="text-xs">Você tem 14 dias de trial grátis.</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loja">Nome da Loja</Label>
              <Input
                id="loja"
                type="text"
                placeholder="Ex: Cell Center"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                "Começar"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
