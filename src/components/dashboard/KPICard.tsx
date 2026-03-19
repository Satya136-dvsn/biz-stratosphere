// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useEffect, useRef, useState } from "react";
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

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

export function KPICard({
  title,
  value,
  change,
  period = "vs last month",
  format = "number",
  variant = "info",
}: KPICardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const animatedValue = useCountUp(Number(value) || 0);

  const formatValue = (val: number) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === "percentage") {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const accentColor = {
    revenue: "hsl(142 71% 45%)",
    growth: "hsl(36 95% 55%)",
    warning: "hsl(36 95% 55%)",
    info: "hsl(224 100% 64%)",
  }[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7.5%)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(220_16%_20%)]",
        "hover:shadow-lg"
      )}
      data-testid="kpi-card"
      data-testid-title={title.toLowerCase().replace(/\s+/g, "-")}
    >
      {/* Top accent line */}
      <div
        className="h-[2px] w-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            {/* Label */}
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.08em]">
              {title}
            </p>

            {/* Value */}
            <p className="text-3xl font-bold text-foreground tracking-tight font-mono">
              {formatValue(animatedValue)}
            </p>

            {/* Change indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold",
                  isNeutral && "bg-muted/50 text-muted-foreground",
                  isPositive && "bg-emerald-500/10 text-emerald-400",
                  !isPositive && !isNeutral && "bg-red-500/10 text-red-400"
                )}
              >
                {isNeutral ? (
                  <Minus className="h-3 w-3" />
                ) : isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {change}%
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/50">{period}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}