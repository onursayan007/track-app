import { defineStore } from 'pinia';
import api from '@/services/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('userRole') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.role,
  },

  actions: {
    /**
     * Quick-login helper for development.
     * Calls the real /auth/login endpoint with pre-seeded credentials
     * so every request carries a valid JWT the backend accepts.
     */
    async loginWithMock(role) {
      this.loading = true;
      this.error = null;

      // Seed credentials — must match prisma/seed.ts (all pw: password123)
      const seedCredentials = {
        SUPER_ADMIN:  { email: 'admin@servisimgeliyor.com',  password: 'password123' },
        TENANT_ADMIN: { email: 'admin@antalya-vip.com',      password: 'password123' },
        DRIVER:       { email: 'driver1@antalya-vip.com',    password: 'password123' },
        PASSENGER:    { email: 'passenger@antalya-vip.com',  password: 'password123' },
      };

      const creds = seedCredentials[role];
      if (!creds) {
        this.error = 'Invalid mock role specified';
        this.loading = false;
        return;
      }

      try {
        const response = await api.post('/auth/login', { identifier: creds.email, password: creds.password });
        // Backend wraps in ApiEnvelope: { success, data: { token, user } }
        const payload = response.data?.data ?? response.data;
        const { token, user } = payload;

        this.token = token;
        this.user = user;
        this.role = user.role;

        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect based on role
        if (user.role === 'SUPER_ADMIN') {
          router.push({ name: 'SuperAdminDashboard' });
        } else if (user.role === 'TENANT_ADMIN') {
          router.push({ name: 'CompanyDashboard' });
        } else if (user.role === 'DRIVER') {
          router.push({ name: 'DriverDashboard' });
        } else if (user.role === 'PASSENGER') {
          router.push({ name: 'PassengerMyBus' });
        } else {
          router.push('/login');
        }
      } catch (err) {
        this.error = err.response?.data?.message || `Mock login failed for ${role}. Is the backend running & seeded?`;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', { identifier: email, password });
        // Backend wraps in ApiEnvelope: { success, data: { token, user } }
        const payload = response.data?.data ?? response.data;
        const { token, user } = payload;

        this.token = token;
        this.user = user;
        this.role = user.role;

        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);

        // Redirect based on role
        if (user.role === 'SUPER_ADMIN') {
          router.push('/super-admin/dashboard');
        } else if (user.role === 'TENANT_ADMIN') {
          router.push('/company/dashboard');
        } else if (user.role === 'DRIVER') {
          router.push('/driver/dashboard');
        } else if (user.role === 'PASSENGER') {
          router.push('/passenger/my-bus');
        } else {
          router.push('/');
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please check your credentials.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.role = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      router.push('/login');
    },

    async fetchUserProfile() {
      if (!this.token) return;
      try {
        const response = await api.get('/auth/me');
        const profile = response.data?.data ?? response.data;
        this.user = profile;
        this.role = profile.role;
      } catch (err) {
        this.logout();
      }
    }
  },
});
