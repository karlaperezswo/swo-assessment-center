import axios from 'axios';

// Configuración de la API
// - En desarrollo local: usa el proxy de Vite (URLs relativas)
// - En port forwarding: usa la URL pública del backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para logging (opcional, útil para debug)
apiClient.interceptors.request.use(
  (config) => {
    const url = config.baseURL
      ? `${config.baseURL}${config.url}`
      : config.url;
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${url}`);
    
    // Log adicional para multipart/form-data
    if (config.headers['Content-Type']?.includes('multipart/form-data')) {
      console.log('📎 Enviando archivo...');
    }
    
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
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout: La petición tardó demasiado');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🔌 Error de Red: No se pudo conectar con el servidor');
      console.error('   Verifica que el backend esté ejecutándose en http://localhost:4000');
    } else if (error.response) {
      console.error('❌ API Response Error:', error.response?.status, error.config?.url);
      console.error('   Mensaje:', error.response?.data);
    } else {
      console.error('❌ Error desconocido:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
