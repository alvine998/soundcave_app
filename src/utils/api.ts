import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../config';
import { getToken, clearToken } from '../storage/tokenStorage';
import { clearUserProfile } from '../storage/userStorage';
import * as navigationService from './navigationService';

let apiInstance: AxiosInstance | null = null;

export const getApiInstance = async (): Promise<AxiosInstance> => {
  if (!apiInstance) {
    apiInstance = axios.create({
      baseURL: CONFIG.BASE_URL,
      timeout: 30000, // 30 detik timeout untuk mobile network
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor untuk menambahkan token
    apiInstance.interceptors.request.use(
      async config => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor untuk handle error
    apiInstance.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token expired atau invalid, clear storage and back to login
          console.error(
            'Unauthorized - token mungkin expired, redirecting to login',
          );
          await clearToken();
          await clearUserProfile();
          resetApiInstance();
          navigationService.reset('Welcome');
        }
        return Promise.reject(error);
      },
    );
  }

  return apiInstance;
};

export const resetApiInstance = () => {
  apiInstance = null;
};

// Fungsi untuk membuat request tanpa token (untuk register/login)
export const getPublicApiInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: 30000, // 30 detik timeout untuk mobile network
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
