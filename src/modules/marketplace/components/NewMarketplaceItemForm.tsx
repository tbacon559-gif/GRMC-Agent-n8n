"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function NewMarketplaceItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const keywords = String(form.get("keywords") ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      title: form.get("title"),
      description: form.get("description") || undefined,
      category: form.get("category") || undefined,
      acquisitionSource: form.get("acquisitionSource") || undefined,
      acquisitionCostCents: form.get("acquisitionCostCents")
        ? Number(form.get("acquisitionCostCents")) * 100
        : undefined,
      askingPriceCents: form.get("askingPriceCents") ? Number(form.get("askingPriceCents")) * 100 : undefined,
      marketplaceUrl: form.get("marketplaceUrl") || undefined,
      keywords,
    };

    const res = await fetch("/api/marketplace/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create item");
      return;
    }
    const { item } = await res.json();
    setOpen(false);
    router.push(`/marketplace/${item.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Add inventory
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" name="title" required />
        <Field label="Category" name="category" placeholder="e.g. Kitchen Appliances" />
        <Field label="Description" name="description" />
        <Field label="Acquisition source" name="acquisitionSource" />
        <Field label="Acquisition cost ($)" name="acquisitionCostCents" type="number" />
        <Field label="Asking price ($)" name="askingPriceCents" type="number" />
        <Field label="Marketplace URL" name="marketplaceUrl" placeholder="https://facebook.com/marketplace/item/..." className="col-span-2" />
        <Field
          label="Keywords (comma-separated)"
          name="keywords"
          placeholder="kitchenaid, stand mixer"
          className="col-span-2"
        />
      </div>
      {error && <p className="text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save & find matches"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
      />
    </label>
  );
}
