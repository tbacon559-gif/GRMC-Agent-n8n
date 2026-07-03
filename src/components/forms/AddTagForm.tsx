"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * PATCH /api/customers/:id treats `tags` as a full replacement of the
 * customer's tag set (see customerRepository#update ->
 * tagRepository#replaceCustomerTags), so adding one tag means sending the
 * existing set plus the new name, not just the new name.
 */
export function AddTagForm({ customerId, existingTags }: { customerId: string; existingTags: string[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newTag = String(form.get("tag") ?? "").trim();
    if (!newTag) return;

    setSubmitting(true);
    await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [...existingTags, newTag] }),
    });
    setSubmitting(false);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1">
      <input
        name="tag"
        placeholder="Add tag..."
        className="w-28 rounded-md border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        +
      </button>
    </form>
  );
}
