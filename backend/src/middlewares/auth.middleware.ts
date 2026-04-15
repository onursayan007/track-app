import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/auth.service';
import { unauthorized } from '../utils/response';

// ─── Augment Express Request globally ────────────────────────────
declare global {
  namespace Express {
    interface Request {
      /** Decoded JWT payload — set by authenticateToken middleware */
      user?: JwtPayload;
    }
  }
}

/**
 * Stateless JWT verification middleware.
 * Reads `Authorization: Bearer <token>` — no cookies, no sessions.
 * Compatible with Headless PWA / Native App flows.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) return unauthorized(res, 'Authentication token missing');

  const payload = AuthService.verifyToken(token);
  if (!payload) return unauthorized(res, 'Invalid or expired token');

  // Attach to request for downstream middleware / controllers
  (req as any).user = payload;
  next();
};