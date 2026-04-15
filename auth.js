import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const role = ref(localStorage.getItem('userRole') || null);
  const isLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (email, password) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;

      token.value = accessToken;
      user.value = userData;
      role.value = userData.role;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('userRole', userData.role);

      // Redirect based on role
      if (userData.role === 'SUPER_ADMIN') {
        await router.push('/super-admin/dashboard');
      } else if (userData.role === 'TENANT_ADMIN') {
        await router.push('/company/dashboard');
      } else if (userData.role === 'DRIVER') {
        await router.push('/driver/dashboard');
      } else {
        await router.push('/');
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    role.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  return {
    user,
    token,
    role,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout
  };
});