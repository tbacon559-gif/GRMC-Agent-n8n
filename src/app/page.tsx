import Link from "next/link";
import { DollarSign, Clock, PackagePlus, Lightbulb } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getDashboardData } from "@/lib/services/dashboard.service";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Everything you need to know before you list, message, or follow up today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Monthly profit"
          value={formatCents(data.monthlyProfitCents)}
          icon={DollarSign}
        />
        <StatTile label="Follow-ups due" value={String(data.followUpsDue.length)} icon={Clock} />
        <StatTile label="New leads" value={String(data.newLeads.length)} icon={PackagePlus} />
        <StatTile
          label="Aging inventory"
          value={String(data.agingInventory.length)}
          hint="Listed longest without a sale"
          icon={PackagePlus}
        />
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
          <CardTitle>AI recommendations</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {data.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suggested buyer matches</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.suggestedMatches.length === 0 && (
              <EmptyState>No open matches yet — add inventory to generate suggestions.</EmptyState>
            )}
            {data.suggestedMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <Link
                    href={`/customers/${match.customerId}`}
                    className="font-medium text-slate-900 hover:underline dark:text-slate-50"
                  >
                    {match.customer.name}
                  </Link>
                  <p className="text-slate-500 dark:text-slate-400">
                    for{" "}
                    <Link href={`/inventory/${match.inventoryItemId}`} className="hover:underline">
                      {match.inventoryItem.title}
                    </Link>
                  </p>
                </div>
                <Badge tone={match.score >= 70 ? "positive" : match.score >= 40 ? "info" : "neutral"}>
                  {match.score}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-ups due</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.followUpsDue.length === 0 && <EmptyState>Nothing overdue.</EmptyState>}
            {data.followUpsDue.map((reminder) => (
              <div key={reminder.id} className="text-sm">
                <Link
                  href={`/customers/${reminder.customerId}`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-50"
                >
                  {reminder.customer.name}
                </Link>
                <p className="text-slate-500 dark:text-slate-400">{reminder.note}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New inventory</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.newInventory.length === 0 && <EmptyState>No newly acquired items.</EmptyState>}
            {data.newInventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/inventory/${item.id}`}
                  className="font-medium text-slate-900 hover:underline dark:text-slate-50"
                >
                  {item.title}
                </Link>
                <Badge>{item.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.recentSales.length === 0 && <EmptyState>No sales recorded yet.</EmptyState>}
            {data.recentSales.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-50">{item.title}</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {item.profitCents != null ? `+${formatCents(item.profitCents)}` : "—"}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory aging</CardTitle>
        </CardHeader>
        <CardBody>
          {data.agingInventory.length === 0 ? (
            <EmptyState>Nothing has been listed long enough to age yet.</EmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Listed</th>
                  <th className="pb-2">Asking</th>
                </tr>
              </thead>
              <tbody>
                {data.agingInventory.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">
                      <Link href={`/inventory/${item.id}`} className="hover:underline">
                        {item.title}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-500 dark:text-slate-400">
                      {item.dateListed ? new Date(item.dateListed).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2">{formatCents(item.askingPriceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}
