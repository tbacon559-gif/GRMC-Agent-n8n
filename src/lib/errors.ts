export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
    this.name = "NotFoundError";
  }
}

export class AIServiceUnavailableError extends Error {
  constructor(reason = "ANTHROPIC_API_KEY is not configured") {
    super(`AI service unavailable: ${reason}`);
    this.name = "AIServiceUnavailableError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
