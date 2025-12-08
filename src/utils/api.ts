import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../config';
import { getToken } from '../storage/tokenStorage';

let apiInstance: AxiosInstance | null = null;

export const getApiInstance = async (): Promise<AxiosInstance> => {
  if (!apiInstance) {
    apiInstance = axios.create({
      baseURL: CONFIG.BASE_URL,
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
      error => {
        if (error.response?.status === 401) {
          // Token expired atau invalid, bisa clear token di sini
          console.error('Unauthorized - token mungkin expired');
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
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

