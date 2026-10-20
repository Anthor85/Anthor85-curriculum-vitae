import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  avanzarMensaje,
  errorAxios,
  flush,
  renderConStore,
  textoMensaje,
} from '../utils';
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
  descripcion: 'Técnico en informática',
  foto: 'www.mifoto.com/foto.jpg',
  linkedinURL: 'https://www.linkedin.com/in/antonio',
  githubURL: 'https://github.com/antonio',
};

// Sin perfil el back responde 404 y el hook lo ignora: la pagina se queda en
// modo creacion.
const SIN_PERFIL = errorAxios(404);

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
    expect(screen.queryByLabelText('Fecha de Nacimiento:')).toBeNull();
    expect(screen.getByLabelText('Descripción:')).toBeInTheDocument();
    expect(screen.getByLabelText('Foto:')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn:')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub:')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Foto:')).toHaveValue('');
    expect(screen.getByLabelText('LinkedIn:')).toHaveValue('');
    expect(screen.getByLabelText('GitHub:')).toHaveValue('');
  });

  test('crear llama a api.post y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Nombre:'), 'Antonio');
    await user.type(screen.getByLabelText('Apellidos:'), 'Menéndez');
    await user.type(screen.getByLabelText('Email:'), 'antonio@menendez.com');
    await user.type(screen.getByLabelText('Teléfono:'), '666555444');
    await user.type(screen.getByLabelText('Dirección:'), 'Alicante');
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
      descripcion: 'Técnico en informática',
      foto: '',
      linkedinURL: '',
      githubURL: '',
      idiomas: [],
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
    expect(screen.getByLabelText('Descripción:')).toHaveValue(
      'Técnico en informática',
    );
    expect(screen.getByLabelText('Foto:')).toHaveValue(
      'www.mifoto.com/foto.jpg',
    );
    expect(screen.getByLabelText('LinkedIn:')).toHaveValue(
      'https://www.linkedin.com/in/antonio',
    );
    expect(screen.getByLabelText('GitHub:')).toHaveValue(
      'https://github.com/antonio',
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
      descripcion: 'Técnico en informática',
      foto: 'www.mifoto.com/foto.jpg',
      linkedinURL: 'https://www.linkedin.com/in/antonio',
      githubURL: 'https://github.com/antonio',
      idiomas: [],
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

  test('editar recorta los espacios de LinkedIn y GitHub', async () => {
    const user = setupUser();
    await renderPagina(PERFIL);

    const linkedin = screen.getByLabelText('LinkedIn:');
    await user.clear(linkedin);
    await user.type(linkedin, '  https://www.linkedin.com/in/otro  ');
    const github = screen.getByLabelText('GitHub:');
    await user.clear(github);
    await user.type(github, '  https://github.com/otro  ');

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith(
      '/perfil',
      expect.objectContaining({
        linkedinURL: 'https://www.linkedin.com/in/otro',
        githubURL: 'https://github.com/otro',
      }),
    );
  });

  test('se puede guardar con LinkedIn y GitHub vacios', async () => {
    const user = setupUser();
    await renderPagina(PERFIL);

    await user.clear(screen.getByLabelText('LinkedIn:'));
    await user.clear(screen.getByLabelText('GitHub:'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith(
      '/perfil',
      expect.objectContaining({ linkedinURL: '', githubURL: '' }),
    );
  });

  test('editar permite añadir idiomas y descarta las filas vacías', async () => {
    const user = setupUser();
    await renderPagina(PERFIL);

    await user.click(screen.getByRole('button', { name: '+ Añadir idioma' }));
    await user.type(screen.getByLabelText('Idioma 1'), '  Inglés ');
    await user.type(screen.getByLabelText('Nivel del idioma 1'), ' B2 ');
    await user.click(screen.getByRole('button', { name: '+ Añadir idioma' }));

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith(
      '/perfil',
      expect.objectContaining({ idiomas: [{ idioma: 'Inglés', nivel: 'B2' }] }),
    );
  });

  test('editar permite borrar un idioma', async () => {
    const user = setupUser();
    await renderPagina({
      ...PERFIL,
      idiomas: [{ idioma: 'Inglés', nivel: 'B2' }],
    });

    await user.click(screen.getByRole('button', { name: 'Borrar idioma 1' }));
    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith(
      '/perfil',
      expect.objectContaining({ idiomas: [] }),
    );
  });

  test('si api.put falla se avisa del error', async () => {
    const user = setupUser();
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderPagina(PERFIL);

    apiMock.put.mockRejectedValueOnce(new Error('Vaya'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Perfil' }));
    await flush();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');

    consola.mockRestore();
  });

  test('si api.get falla avisa del error', async () => {
    apiMock.get.mockRejectedValue(new Error('boom'));
    renderConStore(<Perfil />);
    await flush();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('con loading en el store pinta «Cargando...»', async () => {
    renderConStore(<Perfil />, {
      perfil: {
        perfil: null,
        loading: true,
        error: null,
      },
    });

    expect(
      screen.getByRole('img', { name: 'Cargando...' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre:')).not.toBeInTheDocument();

    await flush();
  });
});
