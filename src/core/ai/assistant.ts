import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, getAnthropicClient } from "@/core/ai/client";
import { defineTool, type ToolDef } from "@/core/ai/tool";
import { MODULES } from "@/core/modules/registry";
import { contactRepository } from "@/core/repositories/contact.repository";
import { financeRepository } from "@/core/repositories/finance.repository";
import { taskRepository } from "@/core/repositories/task.repository";

const SYSTEM_PROMPT = `You are the AI assistant inside Founder OS, an operating system for a solo founder running
multiple businesses (modules) that all share one set of Contacts. Answer the founder's question using the
provided tools to look up real data — never invent contacts, sales, or numbers. If a tool returns no results,
say so plainly. Keep answers short and concrete (names, counts, dollar amounts), formatted for quick reading.
Dollar amounts you receive are in integer cents — convert to dollars before answering.`;

const coreTools: ToolDef[] = [
  defineTool({
    name: "search_contacts",
    description:
      "Search contacts by name, email, or phone. Use this for any question about a specific person across any business.",
    schema: z.object({ query: z.string().describe("Name, email, or phone fragment to search for") }),
    run: async ({ query }) => {
      const contacts = await contactRepository.list({ search: query, take: 10 });
      return contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        tags: contact.tags.map((t) => t.tag.name),
      }));
    },
  }),
  defineTool({
    name: "get_contact_profile",
    description:
      "Look up a contact's full Core profile (tags, notes, tasks, AI memory) by name or partial name.",
    schema: z.object({ query: z.string().describe("Contact name or partial name") }),
    run: async ({ query }) => {
      const matches = await contactRepository.list({ search: query, take: 1 });
      if (!matches.length) return null;
      return contactRepository.getByIdOrThrow(matches[0].id);
    },
  }),
  defineTool({
    name: "get_contact_finance_summary",
    description: "Get a contact's finance history (all transactions across every module) by contact id.",
    schema: z.object({ contactId: z.string() }),
    run: ({ contactId }) => financeRepository.listByContact(contactId),
  }),
  defineTool({
    name: "get_tasks_due",
    description: "List tasks that are due or overdue right now, across every module and contact.",
    schema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
    run: ({ limit }) => taskRepository.listDue(new Date(), limit),
  }),
];

function allTools(): ToolDef[] {
  return [...coreTools, ...MODULES.flatMap((module) => module.assistantTools?.() ?? [])];
}

function toAnthropicTools(tools: ToolDef[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: z.toJSONSchema(tool.schema) as Anthropic.Tool["input_schema"],
  }));
}

const MAX_TOOL_ROUNDS = 4;

export interface AssistantAnswer {
  answer: string;
  toolCalls: Array<{ name: string; input: unknown }>;
}

/**
 * Natural-language Q&A across Core + every registered module. Rather than
 * letting Claude generate SQL (a real injection/hallucination risk), it
 * can only call the typed, repository-backed tools above and each
 * module's own contributed tools — see
 * docs/decisions/0006-ai-assistant-tool-use.md.
 */
export async function answerAssistantQuestion(question: string): Promise<AssistantAnswer> {
  const client = getAnthropicClient();
  const tools = allTools();
  const anthropicTools = toAnthropicTools(tools);
  const toolCalls: AssistantAnswer["toolCalls"] = [];

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      tools: anthropicTools,
    });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0 || response.stop_reason !== "tool_use") {
      const answer = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      return { answer: answer || "I couldn't find an answer to that.", toolCalls };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const tool = tools.find((t) => t.name === block.name);
      toolCalls.push({ name: block.name, input: block.input });
      let content: string;
      try {
        const result = tool ? await tool.run(block.input ?? {}) : { error: "Unknown tool" };
        content = JSON.stringify(result ?? { result: "No data found" });
      } catch (error) {
        content = JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    answer: "I gathered some data but ran out of steps to summarize it — try a more specific question.",
    toolCalls,
  };
}
