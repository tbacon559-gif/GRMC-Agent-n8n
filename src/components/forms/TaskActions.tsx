"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TaskActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function setStatus(status: "done" | "dismissed") {
    setSubmitting(status);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSubmitting(null);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-2 text-xs">
      <button
        onClick={() => setStatus("done")}
        disabled={submitting !== null}
        className="rounded-md bg-emerald-600 px-2 py-1 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {submitting === "done" ? "..." : "Done"}
      </button>
      <button
        onClick={() => setStatus("dismissed")}
        disabled={submitting !== null}
        className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {submitting === "dismissed" ? "..." : "Dismiss"}
      </button>
    </div>
  );
}
