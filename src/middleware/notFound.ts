import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

/** Catch-all for requests that matched no route. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}
