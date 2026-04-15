// ════════════════════════════════════════════════════════════════════
// Async Route Wrapper
// Catches rejected promises and forwards them to the error handler.
// Usage:  router.get('/foo', asyncHandler(MyController.foo));
// ════════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
