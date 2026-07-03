import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RecordSaleForm } from "@/modules/marketplace/components/RecordSaleForm";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { MarkListedButton } from "@/modules/marketplace/components/MarkListedButton";
import { marketplaceItemRepository } from "@/modules/marketplace/repositories/marketplace-item.repository";
import { marketplaceMatchRepository } from "@/modules/marketplace/repositories/marketplace-match.repository";
import { withProfit } from "@/modules/marketplace/services/marketplace-item.service";
import { contactRepository } from "@/core/repositories/contact.repository";
import { formatCents } from "@/lib/money";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketplaceItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const rawItem = await marketplaceItemRepository.findById(id).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });
  if (!rawItem) notFound();
  const item = withProfit(rawItem);

  const [matches, contacts] = await Promise.all([
    marketplaceMatchRepository.listForItem(id),
    contactRepository.list({ take: 200 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{item.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Badge tone="info">{item.status}</Badge>
            {item.category && <Badge>{item.category.name}</Badge>}
            {item.marketplaceUrl && (
              <a href={item.marketplaceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                View listing
              </a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {item.status === "acquired" && <MarkListedButton itemId={item.id} />}
          <DeleteButton
            url={`/api/marketplace/items/${item.id}`}
            redirectTo="/marketplace"
            confirmMessage={`Delete "${item.title}"? This removes its match suggestions too.`}
          />
        </div>
      </div>

      {item.description && <p className="text-sm text-slate-700 dark:text-slate-300">{item.description}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Acquisition cost" value={formatCents(item.acquisitionCostCents)} />
        <MiniStat label="Asking price" value={formatCents(item.askingPriceCents)} />
        <MiniStat label="Sale price" value={formatCents(item.salePriceCents)} />
        <MiniStat label="Profit" value={formatCents(item.profitCents)} />
      </div>

      {item.status !== "sold" && (
        <Card>
          <CardHeader>
            <CardTitle>Record a sale</CardTitle>
          </CardHeader>
          <CardBody>
            <RecordSaleForm itemId={item.id} contacts={contacts.map((c) => ({ id: c.id, name: c.name }))} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suggested buyers</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {matches.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No matches found — no open contact interests overlap with this item yet.
            </p>
          )}
          {matches.map((match) => {
            const breakdown = match.breakdown as { reasons?: string[] } | null;
            return (
              <div key={match.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Link href={`/contacts/${match.contactId}`} className="font-medium text-slate-900 hover:underline dark:text-slate-50">
                    {match.contact.name}
                  </Link>
                  <Badge tone={match.score >= 70 ? "positive" : match.score >= 40 ? "info" : "neutral"}>
                    {match.score}
                  </Badge>
                </div>
                {breakdown?.reasons && (
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-500 dark:text-slate-400">
                    {breakdown.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>
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
