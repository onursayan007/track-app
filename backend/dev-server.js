#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
// Fleet Tracking — Development Mock Server  (no DB / Redis required)
//
// Run:  node backend/dev-server.js
//   or: cd backend && node dev-server.js
//
// All data is in-memory and matches prisma/seed.ts exactly.
// JWT tokens are real (signed with the same secret from .env).
// ════════════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ─── Utility: UUID generator ────────────────────────────────────
const uuid = () => crypto.randomUUID();

// ─── Pre-hashed password (bcrypt, 12 rounds, "password123") ─────
// We compute this once at startup so login comparison works.
let PW_HASH;

// ─── In-Memory Data (mirrors prisma/seed.ts) ────────────────────
const TENANT_A_ID = uuid();
const TENANT_B_ID = uuid();

const tenants = [
  { id: TENANT_A_ID, name: 'Antalya VIP Transfer', domain: 'antalya-vip.com',    subscriptionPlan: 'PRO',      isActive: true, createdAt: new Date().toISOString(), _count: { vehicles: 3, users: 4 } },
  { id: TENANT_B_ID, name: 'Bodrum Shuttle Co.',    domain: 'bodrum-shuttle.com',  subscriptionPlan: 'BUSINESS', isActive: true, createdAt: new Date().toISOString(), _count: { vehicles: 2, users: 3 } },
];

const SUPER_ADMIN_ID = uuid();
const TENANT_ADMIN_A_ID = uuid();
const DRIVER_A1_ID = uuid();
const DRIVER_A2_ID = uuid();
const PASSENGER_A1_ID = uuid();
const TENANT_ADMIN_B_ID = uuid();
const DRIVER_B1_ID = uuid();

const users = [
  { id: SUPER_ADMIN_ID,    email: 'admin@servisimgeliyor.com',   name: 'Platform Super Admin', phone: null,            role: 'SUPER_ADMIN',  tenantId: null,        isActive: true },
  { id: TENANT_ADMIN_A_ID, email: 'admin@antalya-vip.com',       name: 'Ahmet Yılmaz',        phone: '+905551234567', role: 'TENANT_ADMIN', tenantId: TENANT_A_ID, isActive: true },
  { id: DRIVER_A1_ID,      email: 'driver1@antalya-vip.com',     name: 'Mehmet Demir',         phone: '+905559876543', role: 'DRIVER',       tenantId: TENANT_A_ID, isActive: true },
  { id: DRIVER_A2_ID,      email: 'driver2@antalya-vip.com',     name: 'Ali Kaya',             phone: '+905553456789', role: 'DRIVER',       tenantId: TENANT_A_ID, isActive: true },
  { id: PASSENGER_A1_ID,   email: 'passenger@antalya-vip.com',   name: 'Zeynep Öztürk',        phone: null,            role: 'PASSENGER',    tenantId: TENANT_A_ID, isActive: true },
  { id: TENANT_ADMIN_B_ID, email: 'admin@bodrum-shuttle.com',     name: 'Canan Aksoy',          phone: '+905557654321', role: 'TENANT_ADMIN', tenantId: TENANT_B_ID, isActive: true },
  { id: DRIVER_B1_ID,      email: 'driver1@bodrum-shuttle.com',   name: 'Emre Çelik',           phone: '+905552345678', role: 'DRIVER',       tenantId: TENANT_B_ID, isActive: true },
];

const vehicles = [
  { id: uuid(), tenantId: TENANT_A_ID, plate: '07 ABC 123', vin: 'WBA3A5C55CF256789', hardwareType: 'ARVENTO',  deviceId: 'ARV-001-ANT', brand: 'Mercedes-Benz', model: 'Sprinter 516',   year: 2023, capacity: 16, status: 'ACTIVE',      createdAt: new Date().toISOString() },
  { id: uuid(), tenantId: TENANT_A_ID, plate: '07 DEF 456', vin: 'WDB9066331S123456', hardwareType: 'UDP',      deviceId: 'UDP-002-ANT', brand: 'Ford',          model: 'Transit Custom', year: 2024, capacity: 9,  status: 'ACTIVE',      createdAt: new Date().toISOString() },
  { id: uuid(), tenantId: TENANT_A_ID, plate: '07 GHI 789', vin: 'WVWZZZ3CZWE456789', hardwareType: 'APP_ONLY', deviceId: null,          brand: 'Volkswagen',    model: 'Crafter',        year: 2022, capacity: 20, status: 'MAINTENANCE', createdAt: new Date().toISOString() },
  { id: uuid(), tenantId: TENANT_B_ID, plate: '48 JKL 321', vin: 'JTDKN3DU5A0123456', hardwareType: 'ARVENTO',  deviceId: 'ARV-001-BOD', brand: 'Toyota',        model: 'Coaster',        year: 2023, capacity: 30, status: 'ACTIVE',      createdAt: new Date().toISOString() },
  { id: uuid(), tenantId: TENANT_B_ID, plate: '48 MNO 654', vin: 'SALLAAA148A123456', hardwareType: 'APP_ONLY', deviceId: null,          brand: 'Iveco',         model: 'Daily Minibus',  year: 2024, capacity: 14, status: 'ACTIVE',      createdAt: new Date().toISOString() },
];

const routes = [
  { id: uuid(), tenantId: TENANT_A_ID, vehicleId: vehicles[0].id, driverId: DRIVER_A1_ID, name: 'Morning Airport Shuttle — Terminal 1', type: 'SHUTTLE',   status: 'ACTIVE', stopsCount: 3 },
  { id: uuid(), tenantId: TENANT_A_ID, vehicleId: vehicles[1].id, driverId: DRIVER_A2_ID, name: 'Corporate Campus Route — TechPark',    type: 'CORPORATE', status: 'DRAFT',  stopsCount: 4 },
  { id: uuid(), tenantId: TENANT_B_ID, vehicleId: vehicles[3].id, driverId: DRIVER_B1_ID, name: 'Bodrum Peninsula Tour',                type: 'TRANSFER',  status: 'ACTIVE', stopsCount: 5 },
  { id: uuid(), tenantId: TENANT_B_ID, vehicleId: vehicles[4].id, driverId: null,         name: 'School Bus — Bodrum International',     type: 'SCHOOL',    status: 'DRAFT',  stopsCount: 2 },
];

// ─── ApiEnvelope helpers ────────────────────────────────────────
const ok = (res, data) => res.json({ success: true, data });
const created = (res, data) => res.status(201).json({ success: true, data });
const unauthorized = (res, msg) => res.status(401).json({ success: false, message: msg || 'Unauthorized' });
const forbidden = (res, msg) => res.status(403).json({ success: false, message: msg || 'Forbidden' });
const badRequest = (res, msg) => res.status(400).json({ success: false, message: msg || 'Bad request' });
const notFound = (res, msg) => res.status(404).json({ success: false, message: msg || 'Not found' });

// ─── Auth Middleware ────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);
  if (!token) return unauthorized(res, 'Token required');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // { userId, tenantId, role }
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
}

function superAdminOnly(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') return forbidden(res, 'Super admin access required');
  next();
}

// ════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════

/** POST /api/v1/auth/login */
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return badRequest(res, 'Email and password are required');

  const user = users.find(u => u.email === email && u.isActive);
  if (!user) return unauthorized(res, 'Invalid credentials');

  const valid = await bcrypt.compare(password, PW_HASH);
  if (!valid) return unauthorized(res, 'Invalid credentials');

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return ok(res, { token, user });
});

/** GET /api/v1/auth/me */
app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return notFound(res, 'User not found');
  return ok(res, user);
});

// ════════════════════════════════════════════════════════════════════
//  SUPER ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════

/** GET /api/v1/superadmin/tenants */
app.get('/api/v1/superadmin/tenants', authenticateToken, superAdminOnly, (_req, res) => {
  return ok(res, tenants);
});

/** POST /api/v1/superadmin/tenants */
app.post('/api/v1/superadmin/tenants', authenticateToken, superAdminOnly, (req, res) => {
  const { name, domain, subscriptionPlan, isActive } = req.body;
  if (!name) return badRequest(res, 'Tenant name is required');

  const tenant = {
    id: uuid(),
    name,
    domain: domain || null,
    subscriptionPlan: subscriptionPlan || 'FREE',
    isActive: isActive !== false,
    createdAt: new Date().toISOString(),
    _count: { vehicles: 0, users: 0 },
  };
  tenants.push(tenant);
  return created(res, tenant);
});

/** GET /api/v1/superadmin/vehicles */
app.get('/api/v1/superadmin/vehicles', authenticateToken, superAdminOnly, (_req, res) => {
  // Join tenant name
  const data = vehicles.map(v => ({
    ...v,
    tenant: tenants.find(t => t.id === v.tenantId) || null,
  }));
  return ok(res, data);
});

/** POST /api/v1/superadmin/vehicles */
app.post('/api/v1/superadmin/vehicles', authenticateToken, superAdminOnly, (req, res) => {
  const tenantId = req.query.tenantId || req.body.tenantId;
  if (!tenantId) return badRequest(res, 'tenantId is required');

  const vehicle = {
    id: uuid(),
    tenantId,
    plate: req.body.plate || '',
    vin: req.body.vin || null,
    hardwareType: req.body.hardwareType || 'APP_ONLY',
    deviceId: req.body.deviceId || null,
    brand: req.body.brand || '',
    model: req.body.model || '',
    year: req.body.year || new Date().getFullYear(),
    capacity: req.body.capacity || 0,
    status: req.body.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    tenant: tenants.find(t => t.id === tenantId) || null,
  };
  vehicles.push(vehicle);

  // Update tenant _count
  const t = tenants.find(t => t.id === tenantId);
  if (t) t._count.vehicles++;

  return created(res, vehicle);
});

/** POST /api/v1/superadmin/users */
app.post('/api/v1/superadmin/users', authenticateToken, superAdminOnly, async (req, res) => {
  const { email, password, name, phone, role, tenantId } = req.body;
  if (!email || !password || !name) return badRequest(res, 'email, password, and name are required');

  if (users.find(u => u.email === email)) return res.status(409).json({ success: false, message: 'Email already exists' });

  const user = {
    id: uuid(),
    email,
    name,
    phone: phone || null,
    role: role || 'DRIVER',
    tenantId: tenantId || null,
    isActive: true,
  };
  users.push(user);

  // Update tenant _count
  if (tenantId) {
    const t = tenants.find(t => t.id === tenantId);
    if (t) t._count.users++;
  }

  return created(res, user);
});

// ════════════════════════════════════════════════════════════════════
//  TENANT-SCOPED ROUTES  (for TENANT_ADMIN views)
// ════════════════════════════════════════════════════════════════════

/** GET /api/v1/tenant/vehicles */
app.get('/api/v1/tenant/vehicles', authenticateToken, (req, res) => {
  const tid = req.user.tenantId;
  return ok(res, vehicles.filter(v => v.tenantId === tid));
});

/** GET /api/v1/tenant/users */
app.get('/api/v1/tenant/users', authenticateToken, (req, res) => {
  const tid = req.user.tenantId;
  return ok(res, users.filter(u => u.tenantId === tid));
});

/** GET /api/v1/tenant/routes */
app.get('/api/v1/tenant/routes', authenticateToken, (req, res) => {
  const tid = req.user.tenantId;
  return ok(res, routes.filter(r => r.tenantId === tid));
});

// ════════════════════════════════════════════════════════════════════
//  DRIVER ROUTES
// ════════════════════════════════════════════════════════════════════

/** GET /api/v1/driver/profile */
app.get('/api/v1/driver/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  return ok(res, user);
});

/** GET /api/v1/driver/route */
app.get('/api/v1/driver/route', authenticateToken, (req, res) => {
  const route = routes.find(r => r.driverId === req.user.userId);
  return ok(res, route || null);
});

// ════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'dev-mock', db: 'in-memory', redis: 'disabled', uptime: process.uptime() });
});

// ─── 404 Fallback ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ─── Start ──────────────────────────────────────────────────────
async function start() {
  // Pre-hash the password once — bcrypt.compare needs the hash
  PW_HASH = await bcrypt.hash('password123', 12);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Fleet Tracking — DEV MOCK SERVER');
  console.log('  In-memory data · No DB/Redis required');
  console.log('═══════════════════════════════════════════════════════');

  app.listen(PORT, () => {
    console.log(`\n  🚀  http://localhost:${PORT}`);
    console.log(`  📋  API base: http://localhost:${PORT}/api/v1`);
    console.log('');
    console.log('  Test accounts (all pw: password123):');
    console.log('  ─────────────────────────────────────');
    console.log('  SUPER_ADMIN   → admin@servisimgeliyor.com');
    console.log('  TENANT_ADMIN  → admin@antalya-vip.com');
    console.log('  DRIVER        → driver1@antalya-vip.com');
    console.log('  PASSENGER     → passenger@antalya-vip.com');
    console.log('');
  });
}

start().catch(console.error);
