import type Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, getAnthropicClient } from "@/core/ai/client";
import { hasAnthropicApiKey } from "@/lib/env";
import { taskRepository } from "@/core/repositories/task.repository";
import { getFinanceSummary } from "@/core/services/finance.service";
import { MODULES } from "@/core/modules/registry";

async function gatherFacts(now: Date): Promise<string[]> {
  const [tasksDue, finance, moduleFacts] = await Promise.all([
    taskRepository.listDue(now, 10),
    getFinanceSummary(now),
    Promise.all(MODULES.map((module) => module.briefingContributor?.({ now }) ?? Promise.resolve([]))),
  ]);

  const facts: string[] = [];
  if (tasksDue.length) {
    facts.push(
      `${tasksDue.length} task(s) due or overdue: ${tasksDue
        .slice(0, 5)
        .map((t) => t.title)
        .join("; ")}.`,
    );
  } else {
    facts.push("No tasks are currently due.");
  }
  facts.push(
    `This month so far: $${(finance.thisMonth.incomeCents / 100).toFixed(2)} income, $${(
      finance.thisMonth.expenseCents / 100
    ).toFixed(2)} expenses, $${(finance.thisMonth.profitCents / 100).toFixed(2)} profit.`,
  );
  facts.push(...moduleFacts.flat());
  return facts;
}

function fallbackBriefing(facts: string[]): string {
  return ["Here's where things stand:", ...facts.map((fact) => `- ${fact}`)].join("\n");
}

/**
 * The "AI Chief of Staff" morning briefing — generated on-demand (not a
 * scheduled job, per the confirmed scope for this pass). Gathers real
 * facts from Core + every registered module, then asks Claude to turn
 * them into a short prose briefing. Falls back to a plain rule-based
 * summary of the same facts when no ANTHROPIC_API_KEY is configured, so
 * the feature never hard-fails.
 */
export async function getBriefing(now: Date = new Date()): Promise<{ briefing: string; facts: string[] }> {
  const facts = await gatherFacts(now);

  if (!hasAnthropicApiKey) {
    return { briefing: fallbackBriefing(facts), facts };
  }

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    system:
      "You are a founder's AI Chief of Staff. Turn the given facts into a short, warm, direct morning briefing " +
      "(3-6 sentences, plain prose, no headers). Highlight the single highest-leverage thing to focus on today. " +
      "Never invent facts beyond what's given.",
    messages: [{ role: "user", content: facts.join("\n") }],
  });

  const briefing = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { briefing: briefing || fallbackBriefing(facts), facts };
}
