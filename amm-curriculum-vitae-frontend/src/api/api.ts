import axios from 'axios';
import { getEnvVariables } from '../helpers/getEnvVariables';

const { VITE_BASE_URL } = getEnvVariables();

console.log('VITE_BASE_URL:', VITE_BASE_URL);

export const api = axios.create({
  baseURL: VITE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// El token viaja en el header `x-token` en todas las peticiones. Se resuelve
// aqui y no en cada hook para tener un unico punto donde se lee localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers['x-token'] = token;
  }

  return config;
});

export default api;
