import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { config } from '../config';
import { UserRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError, BadRequestError, ConflictError } from '../utils/errors';

/** JWT payload stored inside every access token */
export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: string;
}

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  role?: UserRole;
  tenantId?: string;
  clientId?: string | null;
}

/**
 * Stateless authentication service.
 * Every response includes a signed JWT — no server-side sessions.
 * 100 % compatible with Headless PWA / Native App integrations.
 *
 * Login accepts an `identifier` which can be an email or phone number.
 * Registration requires at least one of email or phone.
 */
export class AuthService {
  // ─── Login (email OR phone) ────────────────────────────────────────
  static async login(identifier: string, password: string) {
    // Detect whether the identifier looks like a phone number or email
    const isPhone = /^\+?[0-9\s()-]{7,}$/.test(identifier.trim());

    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: identifier.trim() } })
      : await prisma.user.findUnique({ where: { email: identifier.trim() } });

    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const token = AuthService.signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const { passwordHash, ...profile } = user;
    return { token, user: profile };
  }

  // ─── Register (used by SuperAdmin to create any user, or Tenant-Admin to onboard) ───
  static async register(input: RegisterInput) {
    // Validation: at least one of email or phone must be provided
    if (!input.email && !input.phone) {
      throw new BadRequestError('At least one of email or phone is required');
    }

    // Check for duplicate email
    if (input.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: input.email } });
      if (emailExists) throw new ConflictError('Email already registered');
    }

    // Check for duplicate phone
    if (input.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (phoneExists) throw new ConflictError('Phone number already registered');
    }

    if (input.clientId) {
      if (!input.tenantId) {
        throw new BadRequestError('tenantId is required when clientId is provided');
      }
      const client = await prisma.client.findFirst({ where: { id: input.clientId, tenantId: input.tenantId } });
      if (!client) throw new BadRequestError('Invalid clientId for tenant scope');
    }

    const hash = await AuthService.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email || null,
        phone: input.phone || null,
        passwordHash: hash,
        name: input.name,
        role: input.role ?? 'PASSENGER',
        tenantId: input.tenantId ?? null,
        clientId: input.clientId ?? null,
      },
    });

    const { passwordHash, ...profile } = user;
    return profile;
  }

  // ─── Get profile by ID ─────────────────────────────────────────────
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundError('User');
    const { passwordHash, ...profile } = user;
    return profile;
  }

  // ─── Token utilities ──────────────────────────────────────────────
  static signToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string | number,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
