"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const currentValue = controlledValue ?? uncontrolledValue;

  const handleValueChange = React.useCallback(
    (next: string) => {
      setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg bg-slate-950/90 p-1 text-slate-400 border border-slate-800",
        className
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  className,
  value,
  ...props
}: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all",
        isActive
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
          : "text-slate-400 hover:text-slate-200",
        className
      )}
      {...props}
    />
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  className,
  value,
  children,
  ...props
}: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return (
    <div className={cn("mt-4 focus-visible:outline-none", className)} {...props}>
      {children}
    </div>
  );
}
