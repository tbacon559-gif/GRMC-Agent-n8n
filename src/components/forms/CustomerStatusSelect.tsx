"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CUSTOMER_STATUSES } from "@/lib/constants/enums";

export function CustomerStatusSelect({ customerId, status }: { customerId: string; status: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value;
    setSubmitting(true);
    await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={status}
      onChange={handleChange}
      disabled={submitting}
      className="rounded-full border-0 bg-indigo-100 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800 disabled:opacity-50 dark:bg-indigo-900/40 dark:text-indigo-300"
    >
      {CUSTOMER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
