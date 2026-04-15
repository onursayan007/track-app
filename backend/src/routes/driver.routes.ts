// ════════════════════════════════════════════════════════════════════
// /api/v1/driver/* — Driver-scoped routes
// ════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { driverOrAbove } from '../middlewares/role.middleware';
import { requireTenantScope } from '../middlewares/tenant.middleware';
import { RouteController } from '../controllers/route.controller';
import { GpsController } from '../controllers/gps.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import prisma from '../lib/prisma';
import { DriverTripController } from '../controllers/driver-trip.controller';

const router = Router();

// Every route requires authenticated driver (or above) + tenant scope
router.use(authenticateToken, driverOrAbove, requireTenantScope);

// ─── Profile ─────────────────────────────────────────────────────
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, licenseClass: true, address: true, role: true, createdAt: true },
  });
  return ok(res, user);
}));

router.patch('/profile', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId as string;
  const { phone, licenseClass, address } = req.body;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(phone !== undefined && { phone }),
      ...(licenseClass !== undefined && { licenseClass }),
      ...(address !== undefined && { address }),
    },
    select: { id: true, email: true, name: true, phone: true, licenseClass: true, address: true, role: true },
  });
  return ok(res, updated);
}));

// ─── Routes assigned to this driver ──────────────────────────────
router.get('/routes',          asyncHandler(RouteController.list));
router.get('/routes/:id',      asyncHandler(RouteController.getById));
router.patch('/routes/:id/status', asyncHandler(RouteController.updateStatus));

// ─── Driver App Core: Trip Flow ──────────────────────────────────
router.get('/assigned-vehicles', asyncHandler(DriverTripController.assignedVehicles));
router.post('/active-trips/start', asyncHandler(DriverTripController.startTrip));
router.get('/active-trips/current', asyncHandler(DriverTripController.currentTrip));
router.patch('/active-trips/:id/complete', asyncHandler(DriverTripController.completeTrip));
router.get('/passenger-requests/pending', asyncHandler(DriverTripController.pendingPassengers));
router.patch('/passenger-requests/:id/decision', asyncHandler(DriverTripController.decidePassengerRequest));
router.get('/passenger-requests/approved', asyncHandler(DriverTripController.approvedPassengers));
router.patch('/passenger-requests/:id/ride-status', asyncHandler(DriverTripController.updatePassengerRideStatus));

// ─── GPS ping ────────────────────────────────────────────────────
router.post('/gps', asyncHandler(GpsController.ping));

export default router;
