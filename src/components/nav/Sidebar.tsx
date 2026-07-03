import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, Sparkles } from "lucide-react";
import { MODULES } from "@/core/modules/registry";

const CORE_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const ASSISTANT_NAV_ITEM = { href: "/assistant", label: "AI Assistant", icon: Sparkles };

/**
 * Core nav items plus one entry per registered module — Sidebar never
 * branches on a module's identity, it just iterates MODULES. Adding a
 * module means it appears here automatically via its manifest's `nav`.
 */
export function Sidebar() {
  const navItems = [...CORE_NAV_ITEMS, ...MODULES.map((m) => m.nav), ASSISTANT_NAV_ITEM];

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-8 px-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Founder OS</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">One identity, every business</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
