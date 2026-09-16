import { act } from '@testing-library/react';

import { errorAxios, renderHookConStore } from '../utils';
import type { AuthState } from '../../src/interfaces/auth.interface';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../src/api/api', () => ({
  default: apiMock,
  api: apiMock,
}));

import { useAuthStore } from '../../src/hooks/useAuthStore';

const CREDENCIALES = { email: 'ammlink@hotmail.com', password: 'secreta123' };

const USUARIO = { uid: '1', nombre: 'Antonio', email: CREDENCIALES.email };

const RESPUESTA = { data: { ...USUARIO, token: 'un-token' } };

const DIA = 24 * 60 * 60 * 1000;

// Clave que no es de sesion: cerrar sesion no debe tocarla.
const CLAVE_AJENA = 'preferencias';

const renderAuth = () => renderHookConStore(useAuthStore);

const auth = (store: { getState: () => unknown }) =>
  (store.getState() as { auth: AuthState }).auth;

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('startLogin', () => {
    test('un login correcto guarda token y fecha y deja la sesion autenticada', async () => {
      apiMock.post.mockResolvedValue(RESPUESTA);
      const { result, store } = renderAuth();

      await act(async () => {
        expect(await result.current.startLogin(CREDENCIALES)).toEqual({
          ok: true,
          errorMessage: null,
        });
      });

      expect(apiMock.post).toHaveBeenCalledWith('/auth', CREDENCIALES);
      expect(localStorage.getItem('token')).toBe('un-token');
      expect(Number(localStorage.getItem('token-init-date'))).toBeGreaterThan(
        0,
      );
      expect(auth(store).status).toBe('authenticated');
      expect(auth(store).user).toEqual(USUARIO);
      expect(auth(store).errorMessage).toBeNull();
    });

    test('con credenciales malas propaga el msg del backend y no guarda sesion', async () => {
      apiMock.post.mockRejectedValue(
        errorAxios(400, { msg: 'Credenciales incorrectas' }),
      );
      const { result, store } = renderAuth();

      await act(async () => {
        expect(await result.current.startLogin(CREDENCIALES)).toEqual({
          ok: false,
          errorMessage: 'Credenciales incorrectas',
        });
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(auth(store).status).toBe('not-authenticated');
      expect(auth(store).errorMessage).toBe('Credenciales incorrectas');
    });

    test('un fallo de red da el mensaje generico de conexion', async () => {
      apiMock.post.mockRejectedValue(new Error('Network Error'));
      const { result, store } = renderAuth();

      await act(async () => {
        expect(await result.current.startLogin(CREDENCIALES)).toEqual({
          ok: false,
          errorMessage: 'No se ha podido conectar',
        });
      });

      expect(auth(store).errorMessage).toBe('No se ha podido conectar');
    });

    test('un error de axios sin msg tambien cae en el mensaje generico', async () => {
      apiMock.post.mockRejectedValue(errorAxios(500, {}));
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.startLogin(CREDENCIALES);
      });

      expect(auth(store).errorMessage).toBe('No se ha podido conectar');
    });
  });

  describe('checkAuthToken', () => {
    test('sin token no llama a la api y deja la sesion cerrada', async () => {
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.checkAuthToken();
      });

      expect(apiMock.get).not.toHaveBeenCalled();
      expect(auth(store).status).toBe('not-authenticated');
      expect(auth(store).errorMessage).toBeNull();
    });

    test('con token pero sin fecha de inicio descarta la sesion', async () => {
      localStorage.setItem('token', 'viejo');
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.checkAuthToken();
      });

      expect(apiMock.get).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(auth(store).status).toBe('not-authenticated');
    });

    test('con la sesion caducada (mas de 30 dias) limpia y no renueva', async () => {
      localStorage.setItem('token', 'viejo');
      localStorage.setItem('token-init-date', String(Date.now() - 31 * DIA));
      localStorage.setItem(CLAVE_AJENA, 'se-queda');
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.checkAuthToken();
      });

      expect(apiMock.get).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token-init-date')).toBeNull();
      expect(localStorage.getItem(CLAVE_AJENA)).toBe('se-queda');
      expect(auth(store).status).toBe('not-authenticated');
    });

    test('con token vigente renueva y refresca la sesion', async () => {
      localStorage.setItem('token', 'vigente');
      localStorage.setItem('token-init-date', String(Date.now() - DIA));
      apiMock.get.mockResolvedValue({
        data: { ...USUARIO, token: 'token-renovado' },
      });
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.checkAuthToken();
      });

      expect(apiMock.get).toHaveBeenCalledWith('/auth/renew');
      expect(localStorage.getItem('token')).toBe('token-renovado');
      expect(auth(store).status).toBe('authenticated');
      expect(auth(store).user).toEqual(USUARIO);
    });

    test('si la renovacion falla limpia el almacenamiento y cierra sesion', async () => {
      localStorage.setItem('token', 'vigente');
      localStorage.setItem('token-init-date', String(Date.now() - DIA));
      localStorage.setItem(CLAVE_AJENA, 'se-queda');
      apiMock.get.mockRejectedValue(
        errorAxios(401, { msg: 'Token no valido' }),
      );
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.checkAuthToken();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token-init-date')).toBeNull();
      expect(localStorage.getItem(CLAVE_AJENA)).toBe('se-queda');
      expect(auth(store).status).toBe('not-authenticated');
      expect(auth(store).errorMessage).toBeNull();
    });
  });

  describe('logout', () => {
    test('borra la sesion del almacenamiento y la deja cerrada sin error', async () => {
      apiMock.post.mockResolvedValue(RESPUESTA);
      localStorage.setItem(CLAVE_AJENA, 'se-queda');
      const { result, store } = renderAuth();

      await act(async () => {
        await result.current.startLogin(CREDENCIALES);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('token-init-date')).toBeNull();
      expect(localStorage.getItem(CLAVE_AJENA)).toBe('se-queda');
      expect(auth(store).status).toBe('not-authenticated');
      expect(auth(store).user).toBeNull();
      expect(auth(store).errorMessage).toBeNull();
    });
  });
});
