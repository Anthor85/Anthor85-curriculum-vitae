import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import { Perfil as IPerfil } from '../../src/interfaces/perfil.interface';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../../src/api/api', () => ({
  default: apiMock,
  api: apiMock,
}));

import { Perfil } from '../../src/pages/Perfil';

const PERFIL: IPerfil = {
  id: '1',
  nombre: 'Antonio',
  apellidos: 'Menéndez',
  email: 'antonio@menendez.com',
  telefono: '666555444',
  direccion: 'Alicante',
  fechaNacimiento: '1990-01-01',
  descripcion: 'Técnico en informática',
  foto: 'www.mifoto.com/foto.jpg',
};

// Sin perfil el back responde 404 y el hook lo ignora: la pagina se queda en
// modo creacion.
const SIN_PERFIL = { response: { status: 404 } };

const configurarApi = (perfil: IPerfil | null = null) => {
  apiMock.get.mockImplementation(() =>
    perfil ? Promise.resolve({ data: perfil }) : Promise.reject(SIN_PERFIL),
  );
  apiMock.post.mockImplementation((_url: string, payload: unknown) =>
    Promise.resolve({ data: { id: '1', ...(payload as object) } }),
  );
  apiMock.put.mockImplementation((_url: string, payload: unknown) =>
    Promise.resolve({ data: { id: '1', ...(payload as object) } }),
  );
};

const renderPagina = async (perfil: IPerfil | null = null) => {
  configurarApi(perfil);

  const utils = renderConStore(<Perfil />);
  await flush();
  return utils;
};

// Los input type="date" no responden bien a user.type en jsdom.
const escribirFecha = (campo: HTMLElement, valor: string) =>
  fireEvent.change(campo, { target: { value: valor } });

describe('<Perfil />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configurarApi();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupUser = () =>
    userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

  test('pinta el formulario con sus campos y su boton', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Nombre:')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellidos:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono:')).toBeInTheDocument();
    expect(screen.getByLabelText('Dirección:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Nacimiento:')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción:')).toBeInTheDocument();
    expect(screen.getByLabelText('Foto:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Crear Perfil' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Editar Perfil' }),
    ).toBeInTheDocument();
  });

  test('sin perfil en el back todos los campos estan vacios', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Nombre:')).toHaveValue('');
    expect(screen.getByLabelText('Apellidos:')).toHaveValue('');
    expect(screen.getByLabelText('Email:')).toHaveValue('');
    expect(screen.getByLabelText('Fecha de Nacimiento:')).toHaveValue('');
    expect(screen.getByLabelText('Foto:')).toHaveValue('');
  });

  test('crear llama a api.post y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Nombre:'), 'Antonio');
    await user.type(screen.getByLabelText('Apellidos:'), 'Menéndez');
    await user.type(screen.getByLabelText('Email:'), 'antonio@menendez.com');
    await user.type(screen.getByLabelText('Teléfono:'), '666555444');
    await user.type(screen.getByLabelText('Dirección:'), 'Alicante');
    escribirFecha(screen.getByLabelText('Fecha de Nacimiento:'), '1990-01-01');
    await user.type(
      screen.getByLabelText('Descripción:'),
      'Técnico en informática',
    );
    await user.click(screen.getByRole('button', { name: 'Crear Perfil' }));

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/perfil', {
      nombre: 'Antonio',
      apellidos: 'Menéndez',
      email: 'antonio@menendez.com',
      telefono: '666555444',
      direccion: 'Alicante',
      fechaNacimiento: '1990-01-01',
      descripcion: 'Técnico en informática',
      foto: '',
    });
    // Tras crear, el perfil ya existe en el store y el boton cambia.
    expect(
      screen.getByRole('button', { name: 'Actualizar Perfil' }),
    ).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Perfil creado');
  });

  test('con un campo obligatorio vacio no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const nombre = screen.getByLabelText('Nombre:');

    await user.type(screen.getByLabelText('Apellidos:'), 'Testing Library');
    await user.click(screen.getByRole('button', { name: 'Crear Perfil' }));

    expect(apiMock.post).not.toHaveBeenCalled();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
    expect(nombre).toBeInvalid();
  });

  test('con perfil existente precarga los campos', async () => {
    await renderPagina(PERFIL);

    expect(screen.getByLabelText('Nombre:')).toHaveValue('Antonio');
    expect(screen.getByLabelText('Apellidos:')).toHaveValue('Menéndez');
    expect(screen.getByLabelText('Email:')).toHaveValue('antonio@menendez.com');
    expect(screen.getByLabelText('Teléfono:')).toHaveValue('666555444');
    expect(screen.getByLabelText('Dirección:')).toHaveValue('Alicante');
    expect(screen.getByLabelText('Fecha de Nacimiento:')).toHaveValue(
      '1990-01-01',
    );
    expect(screen.getByLabelText('Descripción:')).toHaveValue(
      'Técnico en informática',
    );
    expect(screen.getByLabelText('Foto:')).toHaveValue(
      'www.mifoto.com/foto.jpg',
    );
    expect(
      screen.getByRole('button', { name: 'Actualizar Perfil' }),
    ).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
  });

  test('editar llama a api.put y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina(PERFIL);

    const nombre = screen.getByLabelText('Nombre:');
    await user.clear(nombre);
    await user.type(nombre, 'Antonio Manuel');

    const direccion = screen.getByLabelText('Dirección:');
    await user.clear(direccion);
    await user.type(direccion, 'Valencia');

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));

    await flush();

    // El form arrastra el id del perfil cargado dentro del payload.
    expect(apiMock.put).toHaveBeenCalledWith('/perfil', {
      id: '1',
      nombre: 'Antonio Manuel',
      apellidos: 'Menéndez',
      email: 'antonio@menendez.com',
      telefono: '666555444',
      direccion: 'Valencia',
      fechaNacimiento: '1990-01-01',
      descripcion: 'Técnico en informática',
      foto: 'www.mifoto.com/foto.jpg',
    });
    expect(nombre).toHaveValue('Antonio Manuel');

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Perfil actualizado');
  });

  test('editar recorta los espacios de los campos', async () => {
    const user = setupUser();
    await renderPagina(PERFIL);

    const foto = screen.getByLabelText('Foto:');
    await user.clear(foto);
    await user.type(foto, '  www.otrafoto.com/foto.jpg  ');

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith(
      '/perfil',
      expect.objectContaining({ foto: 'www.otrafoto.com/foto.jpg' }),
    );
  });

  test('si api.put falla no se muestra el mensaje', async () => {
    const user = setupUser();
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderPagina(PERFIL);

    apiMock.put.mockRejectedValueOnce(new Error('Vaya'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');

    consola.mockRestore();
  });

  test('con loading en el store pinta «Loading...»', async () => {
    renderConStore(<Perfil />, {
      perfil: {
        perfil: null,
        loading: true,
        error: null,
      },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre:')).not.toBeInTheDocument();

    await flush();
  });

  test('con error en el store pinta el error', async () => {
    renderConStore(<Perfil />, {
      perfil: {
        perfil: null,
        loading: false,
        error: 'Vaya',
      },
    });

    expect(screen.getByText('Error: Vaya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre:')).not.toBeInTheDocument();

    await flush();
  });
});
