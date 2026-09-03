import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { onChecking, onLogin, onLogout } from '../store';
import type {
  AuthState,
  LoginPayload,
  LoginResponse,
} from '../interfaces/auth.interface';

const ERROR_RED = 'No se ha podido conectar';

const guardarSesion = ({ token }: LoginResponse) => {
  localStorage.setItem('token', token);
  localStorage.setItem('token-init-date', String(new Date().getTime()));
};

export const useAuthStore = () => {
  const dispatch = useDispatch();
  const { status, user, errorMessage } = useSelector(
    (state: any) => state.auth as AuthState,
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
