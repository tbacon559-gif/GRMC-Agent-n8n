"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteButtonProps {
  url: string;
  redirectTo: string;
  confirmMessage: string;
  label?: string;
}

export function DeleteButton({ url, redirectTo, confirmMessage, label = "Delete" }: DeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setSubmitting(true);
    const res = await fetch(url, { method: "DELETE" });
    setSubmitting(false);
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
    >
      {submitting ? "Deleting..." : label}
    </button>
  );
}
