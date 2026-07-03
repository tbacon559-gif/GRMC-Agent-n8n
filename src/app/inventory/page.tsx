import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewInventoryForm } from "@/components/forms/NewInventoryForm";
import { inventoryRepository } from "@/lib/repositories/inventory.repository";
import { withProfit } from "@/lib/services/inventory.service";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  acquired: "neutral",
  listed: "info",
  pending: "warning",
  sold: "positive",
  removed: "danger",
} as const;
const STATUSES = ["acquired", "listed", "pending", "sold", "removed"] as const;

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const { search, status } = await searchParams;
  const items = (
    await inventoryRepository.list({
      take: 100,
      search: search || undefined,
      status: status && STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : undefined,
    })
  ).map(withProfit);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Adding an item automatically finds who to contact before you list it.
          </p>
        </div>
        <NewInventoryForm />
      </div>

      <form className="flex flex-wrap gap-2 text-sm" action="/inventory">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by title or description..."
          className="min-w-64 rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Filter
        </button>
        {(search || status) && (
          <Link href="/inventory" className="self-center text-xs text-slate-500 hover:underline dark:text-slate-400">
            Clear
          </Link>
        )}
      </form>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Asking</th>
                <th className="px-5 py-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="px-5 py-3">
                    <Link href={`/inventory/${item.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{item.category?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[item.status as keyof typeof STATUS_TONE] ?? "neutral"}>{item.status}</Badge>
                  </td>
                  <td className="px-5 py-3">{formatCents(item.askingPriceCents)}</td>
                  <td className="px-5 py-3">{item.profitCents != null ? formatCents(item.profitCents) : "—"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500 dark:text-slate-400">
                    No inventory yet — add your first item above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
