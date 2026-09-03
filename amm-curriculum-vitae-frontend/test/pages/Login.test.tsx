import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import type { AuthState } from '../../src/interfaces/auth.interface';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../../src/api/api', () => ({
  default: apiMock,
  api: apiMock,
}));

import { Login } from '../../src/pages/Login';

const CREDENCIALES = {
  email: 'ammlink@hotmail.com',
  password: 'secreta123',
};

const RESPUESTA_LOGIN = {
  data: {
    uid: '1',
    nombre: 'Antonio',
    email: CREDENCIALES.email,
    token: 'un-token',
  },
};

// El backend responde 400 con el motivo en `msg`.
const CREDENCIALES_MALAS = {
  response: { status: 400, data: { msg: 'Credenciales incorrectas' } },
};

// Un rechazo sin `response` es un fallo de red: el servidor no contesto.
const ERROR_DE_RED = new Error('Network Error');

// El destino por defecto tras el login es /experiencia: montamos esa ruta de
// verdad para assertar sobre lo que se pinta, no sobre useNavigate.
const renderPagina = () =>
  renderConStore(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/experiencia" element={<h1>Experiencia</h1>} />
      </Routes>
    </MemoryRouter>,
  );

const rellenarFormulario = async (user: ReturnType<typeof setupUser>) => {
  await user.type(screen.getByLabelText('Email:'), CREDENCIALES.email);
  await user.type(screen.getByLabelText('Contraseña:'), CREDENCIALES.password);
};

const setupUser = () =>
  userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

describe('<Login />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('pinta los dos campos y el boton Entrar', () => {
    renderPagina();

    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  test('la contrasena es de tipo password y ambos campos son obligatorios', () => {
    renderPagina();

    const email = screen.getByLabelText('Email:');
    const password = screen.getByLabelText('Contraseña:');

    expect(email).toHaveAttribute('type', 'email');
    expect(password).toHaveAttribute('type', 'password');
    expect(email).toBeRequired();
    expect(password).toBeRequired();
  });

  test('al enviar llama a api.post una vez con /auth y las credenciales', async () => {
    const user = setupUser();
    apiMock.post.mockResolvedValue(RESPUESTA_LOGIN);

    renderPagina();
    await rellenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await flush();

    expect(apiMock.post).toHaveBeenCalledTimes(1);
    expect(apiMock.post).toHaveBeenCalledWith('/auth', CREDENCIALES);
  });

  test('un login correcto guarda la sesion en localStorage y en el store', async () => {
    const user = setupUser();
    apiMock.post.mockResolvedValue(RESPUESTA_LOGIN);

    const { store } = renderPagina();
    await rellenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await flush();

    expect(localStorage.getItem('token')).toBe('un-token');
    expect(localStorage.getItem('token-init-date')).not.toBeNull();

    const { auth } = store.getState() as { auth: AuthState };
    expect(auth.status).toBe('authenticated');
    expect(auth.user).toEqual({
      uid: '1',
      nombre: 'Antonio',
      email: CREDENCIALES.email,
    });
  });

  test('tras un login correcto se navega a /experiencia', async () => {
    const user = setupUser();
    apiMock.post.mockResolvedValue(RESPUESTA_LOGIN);

    renderPagina();
    await rellenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await flush();

    expect(
      screen.getByRole('heading', { name: 'Experiencia' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Email:')).not.toBeInTheDocument();
  });

  test('con credenciales incorrectas pinta el error y no guarda nada', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(CREDENCIALES_MALAS);

    const { store } = renderPagina();
    await rellenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await flush();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Credenciales incorrectas');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token-init-date')).toBeNull();
    expect((store.getState() as { auth: AuthState }).auth.status).toBe(
      'not-authenticated',
    );
  });

  test('un fallo de red pinta No se ha podido conectar', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(ERROR_DE_RED);

    renderPagina();
    await rellenarFormulario(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await flush();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('No se ha podido conectar');
  });

  test('el boton queda deshabilitado mientras la peticion esta en vuelo', async () => {
    const user = setupUser();

    // El login se deja pendiente a proposito y se rechaza al final: si
    // resolviese bien, la pagina navegaria y el boton dejaria de existir.
    let rechazarLogin: (motivo: unknown) => void = () => {};
    apiMock.post.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rechazarLogin = reject;
        }),
    );

    renderPagina();
    await rellenarFormulario(user);

    const boton = screen.getByRole('button', { name: 'Entrar' });
    await user.click(boton);

    expect(boton).toBeDisabled();

    rechazarLogin(CREDENCIALES_MALAS);
    await flush();

    expect(boton).toBeInTheDocument();
    expect(boton).toBeEnabled();
  });
});
