// ════════════════════════════════════════════════════════════════════
// Swagger / OpenAPI 3.0 Setup
// Mounted at /api/docs
// ════════════════════════════════════════════════════════════════════

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Fleet Tracking B2B SaaS API',
      version: '1.0.0',
      description:
        'Multi-tenant fleet management platform API. Supports JWT authentication, ' +
        'role-based access control and strict tenant data isolation.',
      contact: { name: 'Engineering Team' },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Common ────────────────────────────
        ApiEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data:    { type: 'object', nullable: true },
            message: { type: 'string', nullable: true },
            meta:    { type: 'object', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },

        // ─── Auth ──────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name:     { type: 'string' },
            phone:    { type: 'string', nullable: true },
            role:     { type: 'string', enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'DRIVER', 'PASSENGER'] },
            tenantId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                name:  { type: 'string' },
                role:  { type: 'string' },
              },
            },
          },
        },

        // ─── Tenant ────────────────────────────
        Tenant: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            isActive:  { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TenantInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name:     { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ─── Vehicle ───────────────────────────
        Vehicle: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            tenantId:     { type: 'string', format: 'uuid' },
            plate:        { type: 'string' },
            vin:          { type: 'string' },
            brand:        { type: 'string', nullable: true },
            model:        { type: 'string', nullable: true },
            year:         { type: 'integer', nullable: true },
            capacity:     { type: 'integer', nullable: true },
            hardwareType: { type: 'string', enum: ['ARVENTO', 'UDP', 'APP_ONLY'] },
            deviceId:     { type: 'string', nullable: true },
            status:       { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
            lastLat:      { type: 'number', nullable: true },
            lastLng:      { type: 'number', nullable: true },
            lastSpeed:    { type: 'number', nullable: true },
            lastHeading:  { type: 'number', nullable: true },
            lastSeenAt:   { type: 'string', format: 'date-time', nullable: true },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        VehicleInput: {
          type: 'object',
          required: ['plate', 'vin'],
          properties: {
            plate:        { type: 'string' },
            vin:          { type: 'string' },
            brand:        { type: 'string' },
            model:        { type: 'string' },
            year:         { type: 'integer' },
            capacity:     { type: 'integer' },
            hardwareType: { type: 'string', enum: ['ARVENTO', 'UDP', 'APP_ONLY'] },
            deviceId:     { type: 'string' },
            status:       { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
          },
        },

        // ─── Route / RouteStop ─────────────────
        Route: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            tenantId:  { type: 'string', format: 'uuid' },
            name:      { type: 'string' },
            type:      { type: 'string', enum: ['SHUTTLE', 'TRANSFER', 'SCHOOL', 'CORPORATE'] },
            status:    { type: 'string', enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
            vehicleId: { type: 'string', format: 'uuid', nullable: true },
            driverId:  { type: 'string', format: 'uuid', nullable: true },
            stops:     { type: 'array', items: { $ref: '#/components/schemas/RouteStop' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RouteStop: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            routeId:    { type: 'string', format: 'uuid' },
            name:       { type: 'string' },
            lat:        { type: 'number' },
            lng:        { type: 'number' },
            orderIndex: { type: 'integer' },
          },
        },
        RouteInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name:      { type: 'string' },
            type:      { type: 'string', enum: ['SHUTTLE', 'TRANSFER', 'SCHOOL', 'CORPORATE'] },
            vehicleId: { type: 'string', format: 'uuid' },
            driverId:  { type: 'string', format: 'uuid' },
            stops: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'lat', 'lng', 'orderIndex'],
                properties: {
                  name:       { type: 'string' },
                  lat:        { type: 'number' },
                  lng:        { type: 'number' },
                  orderIndex: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],

    // ────────────────────────────────────────────────────────────
    // Paths — defined inline (JSDoc annotations are also supported
    // if you prefer co-located docs later)
    // ────────────────────────────────────────────────────────────
    paths: {
      // ─── Auth ────────────────────────────────────────
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate user',
          security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            200: { description: 'JWT token + user object', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiEnvelope' }, { properties: { data: { $ref: '#/components/schemas/LoginResponse' } } }] } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          responses: {
            200: { description: 'User profile' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user (admin-only)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
          responses: {
            201: { description: 'Created user' },
            400: { description: 'Validation error' },
            409: { description: 'Duplicate email' },
          },
        },
      },

      // ─── SuperAdmin: Tenants ─────────────────────────
      '/api/v1/superadmin/stats': {
        get: { tags: ['SuperAdmin'], summary: 'Platform-wide statistics', responses: { 200: { description: 'Stats object' } } },
      },
      '/api/v1/superadmin/tenants': {
        get: { tags: ['SuperAdmin'], summary: 'List all tenants', parameters: [{ in: 'query', name: 'search', schema: { type: 'string' } }, { in: 'query', name: 'isActive', schema: { type: 'boolean' } }], responses: { 200: { description: 'Array of tenants' } } },
        post: { tags: ['SuperAdmin'], summary: 'Create tenant', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TenantInput' } } } }, responses: { 201: { description: 'Created tenant' } } },
      },
      '/api/v1/superadmin/tenants/{id}': {
        get: { tags: ['SuperAdmin'], summary: 'Get tenant by ID', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Tenant object' }, 404: { description: 'Not found' } } },
        put: { tags: ['SuperAdmin'], summary: 'Update tenant', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TenantInput' } } } }, responses: { 200: { description: 'Updated tenant' } } },
        delete: { tags: ['SuperAdmin'], summary: 'Deactivate tenant', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Deactivated' } } },
      },

      // ─── SuperAdmin: Users ───────────────────────────
      '/api/v1/superadmin/users': {
        get:  { tags: ['SuperAdmin'], summary: 'List all users (cross-tenant)', responses: { 200: { description: 'Array of users' } } },
        post: { tags: ['SuperAdmin'], summary: 'Create user', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } }, responses: { 201: { description: 'Created user' } } },
      },

      // ─── SuperAdmin: Vehicles ────────────────────────
      '/api/v1/superadmin/vehicles': {
        get: { tags: ['SuperAdmin'], summary: 'List all vehicles (optional tenantId filter)', parameters: [{ in: 'query', name: 'tenantId', schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Array of vehicles' } } },
      },

      // ─── Tenant: Dashboard ───────────────────────────
      '/api/v1/tenant/dashboard': {
        get: { tags: ['Tenant'], summary: 'Tenant dashboard stats', responses: { 200: { description: 'Vehicle + route stats + user count' } } },
      },

      // ─── Tenant: Vehicles ────────────────────────────
      '/api/v1/tenant/vehicles': {
        get:  { tags: ['Tenant'], summary: 'List vehicles (tenant-scoped)', parameters: [{ in: 'query', name: 'status', schema: { type: 'string' } }, { in: 'query', name: 'search', schema: { type: 'string' } }], responses: { 200: { description: 'Array of vehicles' } } },
        post: { tags: ['Tenant'], summary: 'Create vehicle', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } } }, responses: { 201: { description: 'Created vehicle' } } },
      },
      '/api/v1/tenant/vehicles/stats': {
        get: { tags: ['Tenant'], summary: 'Vehicle statistics for tenant', responses: { 200: { description: 'Counts by status' } } },
      },
      '/api/v1/tenant/vehicles/{id}': {
        get:    { tags: ['Tenant'], summary: 'Get vehicle by ID', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Vehicle' }, 404: { description: 'Not found' } } },
        put:    { tags: ['Tenant'], summary: 'Update vehicle', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } } }, responses: { 200: { description: 'Updated vehicle' } } },
        delete: { tags: ['Tenant'], summary: 'Delete vehicle', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: { description: 'Deleted' } } },
      },

      // ─── Tenant: Routes ──────────────────────────────
      '/api/v1/tenant/routes': {
        get:  { tags: ['Tenant'], summary: 'List routes (tenant-scoped)', parameters: [{ in: 'query', name: 'status', schema: { type: 'string' } }, { in: 'query', name: 'type', schema: { type: 'string' } }], responses: { 200: { description: 'Array of routes' } } },
        post: { tags: ['Tenant'], summary: 'Create route', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RouteInput' } } } }, responses: { 201: { description: 'Created route' } } },
      },
      '/api/v1/tenant/routes/stats': {
        get: { tags: ['Tenant'], summary: 'Route statistics for tenant', responses: { 200: { description: 'Counts by status' } } },
      },
      '/api/v1/tenant/routes/{id}': {
        get:    { tags: ['Tenant'], summary: 'Get route by ID', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Route with stops' }, 404: { description: 'Not found' } } },
        put:    { tags: ['Tenant'], summary: 'Update route', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RouteInput' } } } }, responses: { 200: { description: 'Updated route' } } },
        delete: { tags: ['Tenant'], summary: 'Delete route', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: { description: 'Deleted' } } },
      },
      '/api/v1/tenant/routes/{id}/stops': {
        put: { tags: ['Tenant'], summary: 'Replace all stops on a route', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { stops: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, orderIndex: { type: 'integer' } } } } } } } } }, responses: { 200: { description: 'Route with new stops' } } },
      },
      '/api/v1/tenant/routes/{id}/status': {
        patch: { tags: ['Tenant'], summary: 'Update route status', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } } } } } }, responses: { 200: { description: 'Updated route' } } },
      },
      '/api/v1/tenant/routes/optimize': {
        post: { tags: ['Tenant'], summary: 'Optimize route ordering', responses: { 200: { description: 'Optimized route' } } },
      },

      // ─── Driver ──────────────────────────────────────
      '/api/v1/driver/profile': {
        get:   { tags: ['Driver'], summary: 'Get driver profile', responses: { 200: { description: 'Profile' } } },
        patch: { tags: ['Driver'], summary: 'Update driver name/phone', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' } } } } } }, responses: { 200: { description: 'Updated profile' } } },
      },
      '/api/v1/driver/routes': {
        get: { tags: ['Driver'], summary: 'List routes assigned to driver', responses: { 200: { description: 'Array of routes' } } },
      },
      '/api/v1/driver/routes/{id}': {
        get: { tags: ['Driver'], summary: 'Get assigned route detail', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Route with stops' } } },
      },
      '/api/v1/driver/routes/{id}/status': {
        patch: { tags: ['Driver'], summary: 'Update route status (driver)', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] } } } } } }, responses: { 200: { description: 'Updated route' } } },
      },
      '/api/v1/driver/gps': {
        post: { tags: ['Driver'], summary: 'Send GPS ping', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['vehicleId', 'lat', 'lng'], properties: { vehicleId: { type: 'string', format: 'uuid' }, lat: { type: 'number' }, lng: { type: 'number' }, speed: { type: 'number' }, heading: { type: 'number' } } } } } }, responses: { 200: { description: 'Location updated' } } },
      },

      // ─── Health ──────────────────────────────────────
      '/api/health': {
        get: { tags: ['System'], summary: 'Health check', security: [], responses: { 200: { description: 'OK' }, 503: { description: 'Database unreachable' } } },
      },
    },

    tags: [
      { name: 'Auth',       description: 'Authentication & user registration' },
      { name: 'SuperAdmin', description: 'Platform-level management (SUPER_ADMIN only)' },
      { name: 'Tenant',     description: 'Tenant-scoped operations (TENANT_ADMIN+)' },
      { name: 'Driver',     description: 'Driver-scoped operations' },
      { name: 'System',     description: 'Infrastructure endpoints' },
    ],
  },
  // JSDoc annotation scanning (future use — currently all paths are inline)
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Fleet Tracking API',
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Raw JSON spec for MCP / programmatic consumers
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}
