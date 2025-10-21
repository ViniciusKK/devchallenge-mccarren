export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
