import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ok, created, badRequest } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Body: { identifier, password } — identifier can be an email OR phone number.
   * Legacy field `email` is also accepted for backward compat.
   */
  static async login(req: Request, res: Response) {
    const identifier: string | undefined = req.body.identifier || req.body.email;
    const { password } = req.body;
    if (!identifier || !password) throw new BadRequestError('identifier (email or phone) and password are required');

    const result = await AuthService.login(identifier, password);
    return ok(res, result);
  }

  /** GET /api/v1/auth/me — return full profile from JWT userId */
  static async me(req: Request, res: Response) {
    const profile = await AuthService.getProfile((req as any).user.userId);
    return ok(res, profile);
  }

  /**
   * POST /api/v1/auth/register — admin-initiated user creation.
   * Requires at least one of email or phone, plus password and name.
   */
  static async register(req: Request, res: Response) {
    const { email, password, name, phone, role, tenantId, clientId } = req.body;
    if (!password || !name) throw new BadRequestError('password and name are required');
    if (!email && !phone) throw new BadRequestError('At least one of email or phone is required');

    const user = await AuthService.register({ email, password, name, phone, role, tenantId, clientId });
    return created(res, user);
  }
}