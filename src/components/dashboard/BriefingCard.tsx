"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

/** The on-demand "AI Chief of Staff" morning briefing — an explicit user action, not a background job. */
export function BriefingCard() {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchBriefing() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/briefing", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't generate a briefing right now");
      return;
    }
    const data = await res.json();
    setBriefing(data.briefing);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>AI Chief of Staff</CardTitle>
        <button
          onClick={fetchBriefing}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Get today's briefing"}
        </button>
      </CardHeader>
      <CardBody className="text-sm text-slate-700 dark:text-slate-300">
        {error && <p className="text-rose-600">{error}</p>}
        {!error && !briefing && <p className="text-slate-500 dark:text-slate-400">Nothing generated yet.</p>}
        {briefing && <p className="whitespace-pre-wrap">{briefing}</p>}
      </CardBody>
    </Card>
  );
}
