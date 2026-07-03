import Link from "next/link";
import { DollarSign, Clock, Lightbulb } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { TaskActions } from "@/components/forms/TaskActions";
import { ModuleWidgetCard } from "@/components/dashboard/ModuleWidgetCard";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import { getDashboardData } from "@/core/services/dashboard.service";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          What to work on today, across every business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Profit this month"
          value={formatCents(data.finance.thisMonth.profitCents)}
          icon={DollarSign}
        />
        <StatTile label="Tasks due" value={String(data.tasksDue.length)} icon={Clock} />
        <StatTile label="Upcoming events" value={String(data.upcomingEvents.length)} icon={Clock} />
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {data.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <BriefingCard />

      <Card>
        <CardHeader>
          <CardTitle>Tasks due</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {data.tasksDue.length === 0 && <EmptyState>Nothing overdue.</EmptyState>}
          {data.tasksDue.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                {task.contact ? (
                  <Link
                    href={`/contacts/${task.contact.id}`}
                    className="font-medium text-slate-900 hover:underline dark:text-slate-50"
                  >
                    {task.contact.name}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {task.module ?? "Founder"}
                  </span>
                )}
                <p className="text-slate-500 dark:text-slate-400">{task.title}</p>
              </div>
              <TaskActions taskId={task.id} />
            </div>
          ))}
        </CardBody>
      </Card>

      {data.moduleWidgets.map((widget) => (
        <ModuleWidgetCard key={widget!.id} widget={widget!} />
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}
