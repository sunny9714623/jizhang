import {
  BookOpen,
  Bus,
  CircleDot,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Plane,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Utensils,
  Wallet,
  WashingMachine,
} from "lucide-react";
import type { CategoryId, Source } from "@/lib/ledger";
import { cn } from "@/lib/utils";

const ICONS: Record<CategoryId, typeof Utensils> = {
  food: Utensils,
  shopping: ShoppingBag,
  transport: Bus,
  housing: Home,
  daily: WashingMachine,
  fun: Sparkles,
  telecom: Smartphone,
  health: HeartPulse,
  edu: BookOpen,
  gift: Gift,
  digital: Laptop,
  travel: Plane,
  income: Wallet,
  other: CircleDot,
};

export function CatIcon({
  id,
  className,
}: {
  id: CategoryId;
  className?: string;
}) {
  const Icon = ICONS[id] ?? CircleDot;
  return <Icon className={cn("size-4", className)} strokeWidth={1.7} />;
}

export function SourceMark({ source }: { source: Source }) {
  const label = source === "alipay" ? "支" : source === "wechat" ? "微" : "手";
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-xs bg-elevated text-[10px] text-muted shadow-[var(--shadow-border)]">
      {label}
    </span>
  );
}
