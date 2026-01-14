import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  period?: string;
  format?: "currency" | "percentage" | "number";
  variant?: "revenue" | "growth" | "warning" | "info";
}

export function KPICard({
  title,
  value,
  change,
  period = "vs last month",
  format = "number",
  variant = "info"
}: KPICardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const formatValue = (val: string | number) => {
    if (format === "currency") {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(val));
    }
    if (format === "percentage") {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "revenue":
        return "glass border-primary/30 shadow-lg hover:shadow-glow-primary";
      case "growth":
        return "glass border-secondary/30 shadow-lg hover:shadow-glow-secondary";
      case "warning":
        return "glass border-warning/30 shadow-lg hover:shadow-xl";
      default:
        return "glass border-primary/20 shadow-lg hover:shadow-xl";
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1",
        getVariantStyles()
      )}
      data-testid="kpi-card"
      data-testid-title={title.toLowerCase().replace(/\s+/g, '-')}
    >
      <CardContent className="p-7">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {title}
            </p>
            <p className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {formatValue(value)}
            </p>
            <div className="flex items-center space-x-2 text-sm">
              {isNeutral ? (
                <Minus className="h-4 w-4 text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "font-semibold",
                isNeutral && "text-muted-foreground",
                isPositive && "text-success",
                !isPositive && !isNeutral && "text-destructive"
              )}>
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-muted-foreground text-xs">{period}</span>
            </div>
          </div>
        </div>

        {/* Enhanced decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-20 bg-gradient-to-br from-primary via-secondary to-transparent rounded-bl-3xl blur-sm" />
      </CardContent>
    </Card>
  );
}