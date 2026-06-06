import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * Blocks access to the app when the tenant's trial has expired
 * or the subscription is no longer active. Shows a "Reactivate" screen
 * that redirects to /app/billing. The /app/billing route itself is
 * always reachable so the user can fix their plan.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isAccessBlocked, status, trialExpired, loading } = useTenant();

  if (loading) return <>{children}</>;
  if (!isAccessBlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle>Reative seu plano</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {trialExpired
              ? "Seu período de teste gratuito de 14 dias terminou."
              : status === "canceled"
              ? "Sua assinatura foi cancelada."
              : "Sua assinatura está inativa."}{" "}
            Para continuar utilizando o CellCircle, escolha um plano.
          </p>
          <Button className="w-full" onClick={() => navigate("/app/billing")}>
            Ver planos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
