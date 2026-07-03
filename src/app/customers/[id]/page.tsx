import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddNoteForm } from "@/components/forms/AddNoteForm";
import { LogConversationForm } from "@/components/forms/LogConversationForm";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { formatCents } from "@/lib/money";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = await customerRepository.findById(id).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{customer.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Badge tone="info">{customer.status}</Badge>
            {customer.tags.map((t) => (
              <Badge key={t.tagId}>{t.tag.name}</Badge>
            ))}
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
            {customer.facebookProfileUrl && (
              <a href={customer.facebookProfileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Facebook profile
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Reliability" value={`${Math.round(customer.reliabilityScore)}/100`} />
        <MiniStat label="Responsiveness" value={`${Math.round(customer.responsivenessScore)}/100`} />
        <MiniStat label="Total purchases" value={String(customer.totalPurchases)} />
        <MiniStat label="Lifetime spend" value={formatCents(customer.lifetimeSpendCents)} />
      </div>

      {customer.aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle>AI summary</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-slate-700 dark:text-slate-300">{customer.aiSummary}</CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log a conversation</CardTitle>
        </CardHeader>
        <CardBody>
          <LogConversationForm customerId={customer.id} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open interests</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {customer.interests.filter((i) => i.status === "open").length === 0 && (
              <EmptyState>No open interests.</EmptyState>
            )}
            {customer.interests
              .filter((i) => i.status === "open")
              .map((interest) => (
                <div key={interest.id} className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {interest.itemDescription}
                  </span>
                  {interest.category && <span className="ml-2 text-slate-500 dark:text-slate-400">({interest.category.name})</span>}
                  {interest.budgetCents != null && (
                    <span className="ml-2 text-slate-500 dark:text-slate-400">up to {formatCents(interest.budgetCents)}</span>
                  )}
                </div>
              ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up reminders</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {customer.reminders.filter((r) => r.status === "pending").length === 0 && (
              <EmptyState>No pending reminders.</EmptyState>
            )}
            {customer.reminders
              .filter((r) => r.status === "pending")
              .map((reminder) => (
                <div key={reminder.id} className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(reminder.dueAt).toLocaleDateString()}
                  </span>{" "}
                  — {reminder.note}
                </div>
              ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase history</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {customer.purchases.length === 0 && <EmptyState>No purchases yet.</EmptyState>}
            {customer.purchases.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-900 dark:text-slate-50">{item.title}</span>
                <span className="text-slate-500 dark:text-slate-400">{formatCents(item.salePriceCents)}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <AddNoteForm customerId={customer.id} />
            {customer.notes.map((note) => (
              <div key={note.id} className="text-sm">
                <p className="text-slate-700 dark:text-slate-300">{note.body}</p>
                <p className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </Card>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}
