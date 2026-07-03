"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Inventory is created with status "acquired" (see inventory.service.ts).
 * Transitioning to "listed" stamps `dateListed`, which the aging widget and
 * fastest-selling-category analytics both key off of — skipping this step
 * would leave those reading a null date forever.
 */
export function MarkListedButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await fetch(`/api/inventory/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "listed", dateListed: new Date().toISOString() }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {submitting ? "Listing..." : "Mark as listed"}
    </button>
  );
}
