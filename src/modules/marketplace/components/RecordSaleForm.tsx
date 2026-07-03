"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface ContactOption {
  id: string;
  name: string;
}

export function RecordSaleForm({ itemId, contacts }: { itemId: string; contacts: ContactOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/marketplace/items/${itemId}/sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: form.get("contactId"),
        salePriceCents: Number(form.get("salePrice")) * 100,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to record sale");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Buyer</span>
        <select name="contactId" required className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
          <option value="">Select contact...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Sale price ($)</span>
        <input
          name="salePrice"
          type="number"
          required
          className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
        />
      </label>
      {error && <p className="text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Record sale
      </button>
    </form>
  );
}
