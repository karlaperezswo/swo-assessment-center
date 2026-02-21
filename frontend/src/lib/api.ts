import axios from 'axios';

// Configuración de la API
// - En desarrollo local: usa el proxy de Vite (URLs relativas)
// - En port forwarding: usa la URL pública del backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging (opcional, útil para debug)
apiClient.interceptors.request.use(
  (config) => {
    const url = config.baseURL
      ? `${config.baseURL}${config.url}`
      : config.url;
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default apiClient;
