import axios from 'axios';
import { getEnvVariables } from '../helpers/getEnvVariables';
import { store, onLogout } from '../store';

const { VITE_BASE_URL } = getEnvVariables();

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

// Las rutas de sesion ya gestionan su propio 401 (credenciales invalidas o
// token no renovable), asi que no deben pasar por el cierre de sesion global.
const esRutaDeSesion = (url?: string) => !!url && url.startsWith('/auth');

// Si el token caduca estando dentro del panel, cada peticion devolveria 401 y
// se quedaria en el catch de cada hook: el usuario veria una pagina vacia sin
// saber por que. Aqui se limpia la sesion y `RutaPrivada` redirige a /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !esRutaDeSesion(error.config?.url)) {
      localStorage.removeItem('token');
      localStorage.removeItem('token-init-date');
      store.dispatch(onLogout(null));
    }

    return Promise.reject(error);
  },
);

export default api;
