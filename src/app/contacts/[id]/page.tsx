import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddNoteForm } from "@/components/forms/AddNoteForm";
import { AddTagForm } from "@/components/forms/AddTagForm";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { TaskActions } from "@/components/forms/TaskActions";
import { LogConversationForm } from "@/modules/marketplace/components/LogConversationForm";
import { MarketplaceStatusSelect } from "@/modules/marketplace/components/MarketplaceStatusSelect";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { MODULES } from "@/core/modules/registry";
import { marketplaceProfileRepository } from "@/modules/marketplace/repositories/marketplace-profile.repository";
import { marketplaceInterestRepository } from "@/modules/marketplace/repositories/marketplace-interest.repository";
import { formatCents } from "@/lib/money";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contact = await contactRepository.findById(id).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });
  if (!contact) notFound();

  const [marketplaceProfile, marketplaceInterests, financeHistory, otherModuleSummaries] = await Promise.all([
    marketplaceProfileRepository.findByContactId(id),
    marketplaceInterestRepository.listByContact(id),
    financeRepository.listByContact(id),
    Promise.all(
      MODULES.filter((m) => m.id !== "marketplace").map(async (m) => ({
        module: m,
        summary: (await m.getContactSummary?.(id)) ?? null,
      })),
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{contact.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {contact.tags.map((t) => (
              <Badge key={t.tagId}>{t.tag.name}</Badge>
            ))}
            <AddTagForm contactId={contact.id} existingTags={contact.tags.map((t) => t.tag.name)} />
            {contact.phone && <span>{contact.phone}</span>}
            {contact.email && <span>{contact.email}</span>}
            {contact.facebookProfileUrl && (
              <a href={contact.facebookProfileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Facebook profile
              </a>
            )}
          </div>
        </div>
        <DeleteButton
          url={`/api/contacts/${contact.id}`}
          redirectTo="/contacts"
          confirmMessage={`Delete ${contact.name}? This removes their notes, tasks, and business history too.`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Business memberships — the "people exist once, businesses attach" proof: one contact, many module relationships. */}
        {marketplaceProfile && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
            <span className="font-medium text-slate-900 dark:text-slate-50">Marketplace</span>
            <MarketplaceStatusSelect contactId={contact.id} status={marketplaceProfile.status} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              reliability {Math.round(marketplaceProfile.reliabilityScore)} · responsiveness{" "}
              {Math.round(marketplaceProfile.responsivenessScore)}
            </span>
          </div>
        )}
        {otherModuleSummaries
          .filter((row) => row.summary != null)
          .map((row) => (
            <div key={row.module.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <span className="font-medium text-slate-900 dark:text-slate-50">{row.module.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{row.summary!.detail}</span>
            </div>
          ))}
      </div>

      {contact.aiSummaryCache && (
        <Card>
          <CardHeader>
            <CardTitle>AI summary</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-slate-700 dark:text-slate-300">{contact.aiSummaryCache}</CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log a Marketplace conversation</CardTitle>
        </CardHeader>
        <CardBody>
          <LogConversationForm contactId={contact.id} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open Marketplace interests</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {marketplaceInterests.filter((i) => i.status === "open").length === 0 && (
              <EmptyState>No open interests.</EmptyState>
            )}
            {marketplaceInterests
              .filter((i) => i.status === "open")
              .map((interest) => (
                <div key={interest.id} className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-50">{interest.itemDescription}</span>
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
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {contact.tasks.filter((t) => t.status === "pending").length === 0 && (
              <EmptyState>No pending tasks.</EmptyState>
            )}
            {contact.tasks
              .filter((t) => t.status === "pending")
              .map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    {task.dueAt && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}{" "}
                    — {task.title}
                  </div>
                  <TaskActions taskId={task.id} />
                </div>
              ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finance history</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {financeHistory.length === 0 && <EmptyState>No transactions yet.</EmptyState>}
            {financeHistory.map((tx) => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-slate-900 dark:text-slate-50">{tx.description ?? tx.category ?? tx.type}</span>
                <span className={tx.type === "income" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}>
                  {tx.type === "income" ? "+" : "-"}
                  {formatCents(tx.amountCents)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <AddNoteForm contactId={contact.id} />
            {contact.notes.map((note) => (
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}
