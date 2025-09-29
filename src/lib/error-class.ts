import Elysia from "elysia";

export class Forbidden extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class ConflictError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class BadRequest extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class Unauthorized extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class NotFoundError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class InternalServerError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class ServiceUnavailableError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  constructor(public message: string, public errors?: Record<string, string>) {
    super(message);
  }
}

export class RateLimitError extends Error {
  constructor(public message: string, public retryAfter?: number) {
    super(message);
  }
}

export class TimeoutError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class AbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbortError";
  }
}

export class DetectedAdBlock extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class InvalidTokenUsage extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class InvalidReferer extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class TokenExpired extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class InvalidMissingAuthorization extends Error {
  constructor(public message: string) {
    super(message);
  }
}

const getErrorMessage = (err: any): string => {
  if (err && typeof err === "object") {
    if ("message" in err) return String(err.message);
    return String(err);
  }
  return "Unknown error";
};

export const errorPlugin = new Elysia()
  .error("Unauthorized", Unauthorized)
  .error("Forbidden", Forbidden)
  .error("ConflictError", ConflictError)
  .error("BadRequest", BadRequest)
  .error("NotFoundError", NotFoundError)
  .error("InternalServerError", InternalServerError)
  .error("ServiceUnavailableError", ServiceUnavailableError)
  .error("ValidationError", ValidationError)
  .error("RateLimitError", RateLimitError)
  .error("TimeoutError", TimeoutError)
  .error("AbortError", AbortError)
  .error("DetectedAdBlock", DetectedAdBlock)
  .error("InvalidTokenUsage", InvalidTokenUsage)
  .error("InvalidReferer", InvalidReferer)
  .error("TokenExpired", TokenExpired)
  .error("InvalidMissingAuthorization", InvalidMissingAuthorization)
  .onError({ as: "global" }, ({ code, error, path, set }) => {
    const eventName = typeof code === "string" ? `error_${code}` : String(code);

    switch (code) {
      case "BadRequest":
        set.status = 400;
        return { success: false, error: error.message };
      case "AbortError":
        set.status = 400;
        return { success: false, error: error.message };
      case "Unauthorized":
        set.status = 401;
        return { success: false, error: error.message };
      case "Forbidden":
        set.status = 403;
        return { success: false, error: error.message };
      case "NotFoundError":
        set.status = 404;
        return { success: false, error: error.message };
      case "ConflictError":
        set.status = 409;
        return { success: false, error: error.message };
      case "ValidationError":
        set.status = 422;
        return {
          success: false,
          error: error.message,
          errors: (error as ValidationError).errors,
        };
      case "RateLimitError":
        set.status = 429;
        set.headers["Retry-After"] = String(
          (error as RateLimitError).retryAfter || 60
        );
        return { success: false, error: error.message };
      case "InternalServerError":
        set.status = 500;
        return { success: false, error: error.message };
      case "ServiceUnavailableError":
        set.status = 503;
        return { success: false, error: error.message };
      case "TimeoutError":
        set.status = 504;
        return { success: false, error: error.message };
      case "DetectedAdBlock":
        set.status = 403;
        return { success: false, message: "555" };
      case "InvalidTokenUsage":
        set.status = 401;
        return { success: false, message: "444" };
      case "InvalidReferer":
        set.status = 400;
        return { success: false, message: "" };
      case "TokenExpired":
        set.status = 401;
        return { success: false, message: "333" };
      case "InvalidMissingAuthorization":
        set.status = 401;
        return { success: true };
      default:
        set.status = 500;
        return {
          success: false,
          error: `An unexpected error occurred: ${getErrorMessage(error)}`,
        };
    }
  });
