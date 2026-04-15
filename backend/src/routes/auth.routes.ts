// ════════════════════════════════════════════════════════════════════
// /api/v1/auth/* — Authentication routes (mostly public)
// ════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { tenantAdminOrAbove } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Public
router.post('/login', asyncHandler(AuthController.login));

// Protected — returns the full profile from JWT userId
router.get('/me', authenticateToken, asyncHandler(AuthController.me));

// Protected — tenant-admin (or super-admin) can register new users
router.post('/register', authenticateToken, tenantAdminOrAbove, asyncHandler(AuthController.register));

export default router;
