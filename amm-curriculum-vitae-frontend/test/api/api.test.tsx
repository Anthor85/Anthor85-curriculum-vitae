import type { AxiosAdapter } from 'axios';

import api from '../../src/api/api';
import { store, onLogin } from '../../src/store';

// Adaptador falso: cortocircuita la peticion antes de salir a la red y deja
// que los interceptores reales traten la respuesta.
const responderCon = (status: number) => {
  api.defaults.adapter = ((config) =>
    Promise.reject({ config, response: { status } })) as AxiosAdapter;
};

const autenticar = () => {
  localStorage.setItem('token', 'abc');
  localStorage.setItem('token-init-date', '123');
  store.dispatch(onLogin({ uid: '1', nombre: 'Antonio', email: 'a@b.com' }));
};

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('envia el token en el header x-token', async () => {
    localStorage.setItem('token', 'abc');
    const espia = vi.fn();

    api.defaults.adapter = ((config) => {
      espia(config.headers['x-token']);

      return Promise.reject({ config, response: { status: 500 } });
    }) as AxiosAdapter;

    await expect(api.get('/perfil')).rejects.toBeTruthy();
    expect(espia).toHaveBeenCalledWith('abc');
  });

  test('ante un 401 limpia la sesion y despacha onLogout', async () => {
    autenticar();
    localStorage.setItem('preferencias', 'se-queda');
    responderCon(401);

    await expect(api.get('/perfil')).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token-init-date')).toBeNull();
    expect(localStorage.getItem('preferencias')).toBe('se-queda');
    expect(store.getState().auth.status).toBe('not-authenticated');
  });

  test('no cierra sesion ante un 401 de las rutas de /auth', async () => {
    autenticar();
    responderCon(401);

    await expect(api.post('/auth', {})).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBe('abc');
    expect(store.getState().auth.status).toBe('authenticated');
  });

  test('no cierra sesion ante otros errores', async () => {
    autenticar();
    responderCon(500);

    await expect(api.get('/perfil')).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBe('abc');
    expect(store.getState().auth.status).toBe('authenticated');
  });
});
