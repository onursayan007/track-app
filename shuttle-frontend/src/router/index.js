import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/report/:qrToken',
    name: 'PublicFeedbackForm',
    component: () => import('../views/PublicFeedbackForm.vue'),
  },
  {
    path: '/track/:publicAccessId',
    name: 'PassengerPortal',
    component: () => import('../views/PassengerPortal.vue'),
  },
  
  // ==========================================
  // SUPER ADMIN ROUTES (SaaS Patronu)
  // ==========================================
  {
    path: '/super-admin',
    component: () => import('../layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'SUPER_ADMIN' },
    children: [
      {
        path: 'dashboard',
        name: 'SuperAdminDashboard',
        component: () => import('../views/LiveMapDashboard.vue'),
      },
      {
        path: 'vehicles',
        name: 'SuperAdminVehicles',
        component: () => import('../views/SuperAdminVehicles.vue'),
      },
      {
        path: 'billing',
        name: 'SuperAdminBilling',
        component: () => import('../views/SuperAdminBilling.vue'),
      },
      {
        path: 'tenants',
        name: 'SuperAdminTenants',
        component: () => import('../views/SuperAdminTenants.vue'),
      },
      {
        path: 'vehicle-models',
        name: 'SuperAdminVehicleModels',
        component: () => import('../views/SuperAdminVehicleModels.vue'),
      },
      {
        path: 'm2m',
        name: 'SuperAdminM2M',
        component: () => import('../views/SuperAdminM2M.vue'),
      },
      {
        path: 'pricing',
        name: 'SuperAdminPricing',
        component: () => import('../views/SuperAdminPricing.vue'),
      },
      {
        path: 'system-health',
        name: 'SuperAdminSystemHealth',
        component: () => import('../views/SuperAdminSystemHealth.vue'),
      },
      {
        path: 'announcements',
        name: 'SuperAdminAnnouncements',
        component: () => import('../views/SuperAdminAnnouncements.vue'),
      },
      {
        path: 'audit-logs',
        name: 'SuperAdminAuditLogs',
        component: () => import('../views/SuperAdminAuditLogs.vue'),
      },
      {
        path: 'settings',
        name: 'SuperAdminSettings',
        component: () => import('../views/SuperAdminSettings.vue'),
      }
      // Not: Feedback ve Alarms buradan bilerek kaldırıldı. (Firma paneline ait oldukları için)
    ],
  },
  
  // ==========================================
  // COMPANY/TENANT ROUTES (Taşeron Firma)
  // ==========================================
  {
    path: '/company',
    component: () => import('../layouts/CompanyLayout.vue'),
    meta: { requiresAuth: true, role: ['TENANT_ADMIN', 'TENANT_OPERATOR'] },
    children: [
      {
        path: 'dashboard',
        name: 'CompanyDashboard',
        component: () => import('../views/CompanyLiveOps.vue'),
      },
      {
        path: 'planning',
        name: 'CompanyPlanning',
        component: () => import('../views/CompanyTours.vue'),
      },
      {
        path: 'routes',
        name: 'CompanyRoutes', // İsim güncellendi
        component: () => import('../views/CompanyRoutes.vue'), // Hatanın kaynağı burasıydı, dosya adı düzeltildi!
      },
      {
        path: 'fleet',
        name: 'CompanyFleet',
        component: () => import('../views/CompanyVehicles.vue'),
      },
      {
        path: 'drivers',
        name: 'CompanyDrivers',
        component: () => import('../views/CompanyDrivers.vue'),
      },
      {
        path: 'passengers',
        name: 'CompanyPassengers',
        component: () => import('../views/CompanyPassengers.vue'),
      },
      {
        path: 'clients',
        name: 'CompanyClients',
        component: () => import('../views/CompanyClients.vue'),
      },
      {
        path: 'dispatch',
        name: 'CompanyDispatch',
        component: () => import('../views/CompanyDispatch.vue'),
      },
      {
        path: 'reports',
        name: 'CompanyReports',
        component: () => import('../views/CompanyFinance.vue'),
      },
      {
        path: 'maintenance',
        name: 'CompanyMaintenance',
        component: () => import('../views/CompanyMaintenance.vue'),
      },
      {
        path: 'feedback',
        name: 'CompanyFeedback',
        component: () => import('../views/CompanyFeedback.vue'),
      },
      {
        path: 'alarms',
        name: 'CompanyAlarms',
        component: () => import('../views/CompanyAlarms.vue'),
      },
      {
        path: 'settings',
        name: 'CompanySettings',
        component: () => import('../views/CompanySettings.vue'),
      },
    ],
  },
  
  // ==========================================
  // DRIVER ROUTES (Şoför Uygulaması)
  // ==========================================
  {
    path: '/driver',
    component: () => import('../layouts/DriverLayout.vue'),
    meta: { requiresAuth: true, role: 'DRIVER' },
    children: [
      {
        path: 'dashboard',
        name: 'DriverDashboard',
        component: () => import('../views/DriverDashboard.vue'),
      },
      {
        path: 'profile',
        name: 'DriverProfile',
        component: () => import('../views/DriverProfile.vue'),
      },
      {
        path: 'route',
        name: 'DriverRoute',
        component: () => import('../views/DriverRoute.vue'),
      },
      {
        path: 'create-route',
        name: 'DriverCreateRoute',
        component: () => import('../views/DriverCreateRoute.vue'),
      },
      {
        path: 'requests',
        name: 'DriverRequests',
        component: () => import('../views/DriverRequests.vue'),
      },
    ],
  },
  
  // ==========================================
  // PASSENGER ROUTES (Yolcu Uygulaması)
  // ==========================================
  {
    path: '/passenger',
    component: () => import('../layouts/PassengerLayout.vue'),
    meta: { requiresAuth: true, role: 'PASSENGER' },
    redirect: '/passenger/my-bus', // <-- STEP 1.1
    children: [
      {
        path: 'dashboard/:routeId', // <-- STEP 1.2
        name: 'PassengerDashboard',
        component: () => import('../views/PassengerDashboard.vue'),
      },
      {
        path: 'my-bus',
        name: 'PassengerMyBus',
        component: () => import('../views/PassengerMyBus.vue'),
      },
      {
        path: 'profile',
        name: 'PassengerProfile',
        component: () => import('../views/PassengerProfile.vue'),
      },
    ],
  },
  
  // Catch-all for 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard (Kimlik Doğrulama ve Yetki Kontrolü)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  const isAuthenticated = !!authStore.token || !!localStorage.getItem('token');
  const storedUserRole = localStorage.getItem('userRole');
  const storedUserRaw = localStorage.getItem('user');
  let storedUserRoleFromProfile = null;
  if (storedUserRaw) {
    try {
      storedUserRoleFromProfile = JSON.parse(storedUserRaw)?.role || null;
    } catch {
      storedUserRoleFromProfile = null;
    }
  }

  const userRole = authStore.userRole || (authStore.user && authStore.user.role) || storedUserRole || storedUserRoleFromProfile || localStorage.getItem('role');
  
  const requiredRole = to.meta.role;

  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      if (requiredRole) {
        const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowed.includes(userRole)) {
          console.error(`Auth Error: Role '${userRole}' cannot access route that requires [${allowed.join(', ')}].`);
          next({ name: 'Login' });
          return;
        }
      }
      next();
    } else {
      next({ name: 'Login' });
    }
  } else if (to.name === 'Login' && isAuthenticated) {
    if (userRole === 'SUPER_ADMIN') next({ name: 'SuperAdminDashboard' });
    else if (userRole === 'TENANT_ADMIN' || userRole === 'TENANT_OPERATOR') next({ name: 'CompanyDashboard' });
    else if (userRole === 'DRIVER') next({ name: 'DriverDashboard' });
    else if (userRole === 'PASSENGER') next({ name: 'PassengerMyBus' });
    else next('/');
  }
  else {
    next();
  }
});

export default router;