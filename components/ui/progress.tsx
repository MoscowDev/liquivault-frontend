import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-emerald-500 transition-all duration-300",
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
