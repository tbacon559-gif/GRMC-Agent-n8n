import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ModuleWidgetData } from "@/core/modules/types";

/** Generic renderer for a module's dashboardWidget() contribution — Core never branches on which module this is. */
export function ModuleWidgetCard({ widget }: { widget: ModuleWidgetData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {widget.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{stat.value}</p>
            </div>
          ))}
        </div>
        {widget.items && widget.items.length > 0 && (
          <ul className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            {widget.items.map((item, i) =>
              item.href ? (
                <li key={i}>
                  <Link href={item.href} className="text-slate-700 hover:underline dark:text-slate-300">
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={i} className="text-slate-700 dark:text-slate-300">
                  {item.label}
                </li>
              ),
            )}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
