import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { onChecking, onLogin, onLogout, RootState } from '../store';
import type {
  AuthState,
  LoginPayload,
  LoginResponse,
} from '../interfaces/auth.interface';

const ERROR_RED = 'No se ha podido conectar';

// El backend firma el token con `expiresIn: '30d'`. Se replica aqui para poder
// descartar la sesion en cliente sin esperar al 401 de `/auth/renew`.
const DURACION_SESION = 30 * 24 * 60 * 60 * 1000;

const guardarSesion = ({ token }: LoginResponse) => {
  localStorage.setItem('token', token);
  localStorage.setItem('token-init-date', String(new Date().getTime()));
};

// Sin fecha de inicio no se puede saber la antiguedad del token: se trata como
// caducado para no arrastrar sesiones de versiones anteriores.
const sesionCaducada = () => {
  const inicio = Number(localStorage.getItem('token-init-date'));

  if (!inicio) return true;

  return new Date().getTime() - inicio > DURACION_SESION;
};

export const useAuthStore = () => {
  const dispatch = useDispatch();
  const { status, user, errorMessage } = useSelector(
    (state: RootState) => state.auth as AuthState,
  );

  const startLogin = async ({ email, password }: LoginPayload) => {
    dispatch(onChecking());

    try {
      const { data } = await api.post<LoginResponse>('/auth', {
        email,
        password,
      });

      guardarSesion(data);
      dispatch(
        onLogin({ uid: data.uid, nombre: data.nombre, email: data.email }),
      );

      return { ok: true, errorMessage: null };
    } catch (error) {
      // Sin `response` no hubo respuesta del servidor: es un fallo de red.
      const mensaje: string = (error as any)?.response?.data?.msg ?? ERROR_RED;

      dispatch(onLogout(mensaje));

      return { ok: false, errorMessage: mensaje };
    }
  };

  const checkAuthToken = async () => {
    const token = localStorage.getItem('token');

    if (!token) return dispatch(onLogout(null));

    if (sesionCaducada()) {
      localStorage.clear();

      return dispatch(onLogout(null));
    }

    try {
      const { data } = await api.get<LoginResponse>('/auth/renew');

      guardarSesion(data);
      dispatch(
        onLogin({ uid: data.uid, nombre: data.nombre, email: data.email }),
      );
    } catch {
      localStorage.clear();
      dispatch(onLogout(null));
    }
  };

  const logout = () => {
    localStorage.clear();
    dispatch(onLogout(null));
  };

  return {
    status,
    user,
    errorMessage,

    startLogin,
    checkAuthToken,
    logout,
  };
};
