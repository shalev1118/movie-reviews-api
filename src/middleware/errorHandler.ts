import type { NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../types/api';
import { AppError } from '../utils/AppError';

/** Express's JSON body parser reports malformed JSON with this error type. */
function isJsonParseError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed';
}

/**
 * Global error handler. Expected errors (AppError) keep their status and message;
 * anything else becomes a generic 500 so internal details never reach the client.
 */
export function errorHandler(err: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  if (isJsonParseError(err)) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
