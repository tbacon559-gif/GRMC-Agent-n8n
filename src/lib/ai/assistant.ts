import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, getAnthropicClient } from "@/lib/ai/client";
import * as analytics from "@/lib/services/analytics.service";

const SYSTEM_PROMPT = `You are the AI assistant inside a CRM for a Facebook Marketplace reseller.
Answer the seller's question using the provided tools to look up real data — never invent
customers, sales, or numbers. If a tool returns no results, say so plainly. Keep answers short
and concrete (names, counts, dollar amounts), formatted for quick reading. Dollar amounts you
receive are in integer cents — convert to dollars before answering.`;

interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodType;
  /** Validates the AI-supplied input against `schema` before invoking the underlying analytics call. */
  run: (rawInput: unknown) => Promise<unknown>;
}

function defineTool<Schema extends z.ZodType>(config: {
  name: string;
  description: string;
  schema: Schema;
  run: (input: z.infer<Schema>) => Promise<unknown>;
}): ToolDef {
  return {
    name: config.name,
    description: config.description,
    schema: config.schema,
    run: (rawInput) => config.run(config.schema.parse(rawInput)),
  };
}

const tools: ToolDef[] = [
  defineTool({
    name: "search_customers_by_interest",
    description:
      "Find customers with an open interest matching a keyword or item description, e.g. 'kitchenaid mixer' or 'patio set'.",
    schema: z.object({ query: z.string().describe("Keyword or item description to search for") }),
    run: ({ query }) => analytics.searchCustomersByInterest(query),
  }),
  defineTool({
    name: "get_top_buyers_by_category",
    description: "Find customers who have previously bought items in a given category, ranked by purchase count.",
    schema: z.object({ category: z.string().describe("Category name or keyword, e.g. 'kitchen appliances'") }),
    run: ({ category }) => analytics.getTopBuyersByCategory(category),
  }),
  defineTool({
    name: "get_fastest_selling_categories",
    description: "List inventory categories ranked by average days-to-sell, fastest first.",
    schema: z.object({}),
    run: () => analytics.getFastestSellingCategories(),
  }),
  defineTool({
    name: "get_fastest_responders",
    description: "List customers ranked by how quickly they typically respond (responsiveness score).",
    schema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
    run: ({ limit }) => analytics.getFastestResponders(limit),
  }),
  defineTool({
    name: "search_inventory",
    description: "Search inventory items by title/description keyword.",
    schema: z.object({ query: z.string() }),
    run: ({ query }) => analytics.searchInventory(query),
  }),
  defineTool({
    name: "get_customer_profile",
    description: "Look up a customer's full profile (status, purchase history, reliability, open interests) by name.",
    schema: z.object({ query: z.string().describe("Customer name or partial name") }),
    run: ({ query }) => analytics.getCustomerProfileByName(query),
  }),
  defineTool({
    name: "get_match_suggestions_for_item",
    description:
      "Get the ranked list of customers recommended to contact about a specific inventory item, by item id or title.",
    schema: z.object({ itemQuery: z.string() }),
    run: ({ itemQuery }) => analytics.getMatchSuggestionsForItem(itemQuery),
  }),
];

function toAnthropicTools(): Anthropic.Tool[] {
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
 * Natural-language Q&A over the CRM's data. Rather than letting Claude
 * generate SQL (a real injection/hallucination risk), it can only call the
 * typed, repository-backed tools above — see
 * docs/decisions/0006-ai-assistant-tool-use.md.
 */
export async function answerAssistantQuestion(question: string): Promise<AssistantAnswer> {
  const client = getAnthropicClient();
  const anthropicTools = toAnthropicTools();
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
