"use client";

import { useState, type FormEvent } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const EXAMPLE_QUESTIONS = [
  "Who wanted a KitchenAid mixer?",
  "Who buys kitchen appliances?",
  "What items sell fastest?",
  "Which contacts respond the quickest?",
];

interface Answer {
  answer: string;
  toolCalls: Array<{ name: string; input: unknown }>;
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Answer | null>(null);

  async function ask(q: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
      return;
    }
    setResult(await res.json());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) ask(question.trim());
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ask about contacts, inventory, and sales across every business, in plain English.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Who should I message about this patio set?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q);
              ask(q);
            }}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <Card>
          <CardBody className="text-sm text-rose-600">{error}</CardBody>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{result.answer}</p>
            {result.toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                {result.toolCalls.map((call, i) => (
                  <Badge key={i} tone="neutral">
                    {call.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
