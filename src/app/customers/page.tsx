import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewCustomerForm } from "@/components/forms/NewCustomerForm";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_TONE = { prospect: "info", buyer: "positive", seller: "warning" } as const;
const STATUSES = ["prospect", "buyer", "seller"] as const;

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { search, status } = await searchParams;
  const customers = await customerRepository.list({
    take: 100,
    search: search || undefined,
    status: status && STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Customers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Every buyer, seller, and prospect you&apos;ve ever talked to.
          </p>
        </div>
        <NewCustomerForm />
      </div>

      <form className="flex flex-wrap gap-2 text-sm" action="/customers">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, email, phone..."
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
          <Link href="/customers" className="self-center text-xs text-slate-500 hover:underline dark:text-slate-400">
            Clear
          </Link>
        )}
      </form>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Tags</th>
                <th className="px-5 py-3">Last contact</th>
                <th className="px-5 py-3">Purchases</th>
                <th className="px-5 py-3">Lifetime spend</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="px-5 py-3">
                    <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[customer.status as keyof typeof STATUS_TONE] ?? "neutral"}>
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((t) => (
                        <Badge key={t.tagId}>{t.tag.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {customer.lastContactAt ? new Date(customer.lastContactAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3">{customer.totalPurchases}</td>
                  <td className="px-5 py-3">{formatCents(customer.lifetimeSpendCents)}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500 dark:text-slate-400">
                    No customers yet — add your first one above.
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
