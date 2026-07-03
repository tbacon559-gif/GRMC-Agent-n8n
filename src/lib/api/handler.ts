import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AIServiceUnavailableError, NotFoundError, UnauthorizedError } from "@/lib/errors";

/**
 * Wraps a route handler so every route gets the same error-to-status-code
 * mapping instead of duplicating try/catch in every file.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
      }
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error instanceof AIServiceUnavailableError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
