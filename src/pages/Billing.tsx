import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { PLANS, planFromPriceId } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tenant, plano, status, trialDaysRemaining, trialExpired, isOwner, refetch, loading } =
    useTenant();
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = plano ?? "free";

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!isOwner) {
      toast.error("Apenas o dono da loja pode alterar a assinatura.");
      return;
    }
    setBusy(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar checkout");
    } finally {
      setBusy(null);
    }
  };

  const handlePortal = async () => {
    if (!isOwner) {
      toast.error("Apenas o dono da loja pode gerenciar a assinatura.");
      return;
    }
    setBusy("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao abrir portal");
    } finally {
      setBusy(null);
    }
  };

  const statusLabel: Record<string, string> = {
    trialing: "Em teste gratuito",
    active: "Ativa",
    past_due: "Pagamento atrasado",
    canceled: "Cancelada",
    unpaid: "Não paga",
    incomplete: "Pagamento incompleto",
    incomplete_expired: "Pagamento expirado",
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Assinatura</h1>
        </div>

        {params.get("success") && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
            Assinatura concluída! Pode levar alguns segundos para aparecer aqui.
            <Button variant="link" className="px-2" onClick={() => refetch()}>
              Atualizar
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Plano atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold capitalize">{currentPlan}</span>
              <Badge variant={status === "active" ? "default" : "secondary"}>
                {status ? statusLabel[status] ?? status : "—"}
              </Badge>
            </div>
            {status === "trialing" && (
              <p className="text-sm text-muted-foreground">
                {trialExpired
                  ? "Seu período de teste terminou."
                  : `${trialDaysRemaining} dia(s) restantes do teste gratuito.`}
              </p>
            )}
            {tenant?.stripe_customer_id && (
              <div className="pt-2">
                <Button onClick={handlePortal} disabled={busy === "portal" || !isOwner} variant="outline">
                  {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Gerenciar assinatura
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.id;
            return (
              <Card
                key={p.id}
                className={p.highlight ? "border-primary ring-1 ring-primary/30" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {p.name}
                    {isCurrent && <Badge>Atual</Badge>}
                  </CardTitle>
                  <p className="text-3xl font-bold">
                    {p.price}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {p.priceId ? (
                    <Button
                      className="w-full"
                      disabled={!!busy || !isOwner}
                      variant={isCurrent ? "outline" : "default"}
                      onClick={() => handleCheckout(p.priceId!, p.id)}
                    >
                      {busy === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isCurrent ? "Renovar / Trocar" : `Assinar ${p.name}`}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Plano gratuito
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isOwner && (
          <p className="text-sm text-muted-foreground text-center">
            Apenas o dono da loja pode alterar a assinatura.
          </p>
        )}
      </div>
    </div>
  );
}
