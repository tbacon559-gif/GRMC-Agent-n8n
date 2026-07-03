import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}

export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </Card>
  );
}
