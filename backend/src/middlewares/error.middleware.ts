// ════════════════════════════════════════════════════════════════════
// Global Error-Handling Middleware
// Catches AppError (+ Prisma errors) and returns a uniform envelope.
// Must be registered LAST in the middleware chain.
// ════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { config } from '../config';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Known application errors ────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // ── Prisma unique-constraint violation (P2002) ──────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      res.status(409).json({
        success: false,
        message: `Duplicate value for: ${fields}`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }
  }

  // ── Prisma validation error ─────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided',
    });
    return;
  }

  // ── JSON parse error ────────────────────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body',
    });
    return;
  }

  // ── Unexpected errors ───────────────────────────────────────────
  console.error('🔥 Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}
