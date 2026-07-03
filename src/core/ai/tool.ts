import { z } from "zod";

/**
 * Shared tool-definition shape used by the Core assistant and by every
 * module's `assistantTools()` contribution (src/core/modules/types.ts).
 * Pulled into its own file (rather than living in assistant.ts) so a
 * module's manifest can import the `ToolDef`/`defineTool` types without
 * creating a module → Core-assistant → module-registry import cycle.
 */
export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodType;
  /** Validates the AI-supplied input against `schema` before invoking the underlying call. */
  run: (rawInput: unknown) => Promise<unknown>;
}

export function defineTool<Schema extends z.ZodType>(config: {
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
