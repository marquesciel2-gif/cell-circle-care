import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UpgradeNoticeProps {
  title?: string;
  message: string;
  cta?: string;
}

export function UpgradeNotice({
  title = "Recurso do plano pago",
  message,
  cta = "Fazer upgrade",
}: UpgradeNoticeProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button asChild>
        <Link to="/app/billing">{cta}</Link>
      </Button>
    </div>
  );
}
