import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "primary" | "success" | "warning" | "danger";
}
const variantStyles = {
  primary: "gradient-primary",
  success: "gradient-success",
  warning: "gradient-warning",
  danger: "gradient-danger"
};
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "primary"
}: StatCardProps) {
  return <div className="stat-card animate-fade-in">
      <div className={cn("stat-card-gradient", variantStyles[variant])} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            {trend && <p className={cn("mt-2 text-sm font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
                {trend.isPositive ? "+" : ""}{trend.value}% este mês
              </p>}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", variantStyles[variant])}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>;
}