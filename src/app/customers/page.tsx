import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewCustomerForm } from "@/components/forms/NewCustomerForm";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

const STATUS_TONE = { prospect: "info", buyer: "positive", seller: "warning" } as const;

export default async function CustomersPage() {
  const customers = await customerRepository.list({ take: 100 });

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
