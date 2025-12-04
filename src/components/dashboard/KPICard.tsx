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
        return "bg-gradient-revenue border-revenue/20 shadow-glow";
      case "growth":
        return "bg-gradient-to-br from-growth/10 to-growth/5 border-growth/20";
      case "warning":
        return "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20";
      default:
        return "bg-gradient-primary border-primary/20 shadow-glow";
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 animate-fade-in",
      getVariantStyles()
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {formatValue(value)}
            </p>
            <div className="flex items-center space-x-2 text-sm">
              {isNeutral ? (
                <Minus className="h-4 w-4 text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp className="h-4 w-4 text-accent" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "font-medium",
                isNeutral && "text-muted-foreground",
                isPositive && "text-accent",
                !isPositive && !isNeutral && "text-destructive"
              )}>
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-muted-foreground">{period}</span>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
      </CardContent>
    </Card>
  );
}