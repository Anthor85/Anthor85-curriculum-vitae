import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import {
  Conocimiento as IConocimiento,
  ConocimientoPrioridad,
} from '../../src/interfaces/conocimiento.interface';

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

import { Conocimiento } from '../../src/pages/Conocimiento';

const CONOCIMIENTOS: IConocimiento[] = [
  { id: '1', titulo: 'React', prioridad: ConocimientoPrioridad.ALTA },
  { id: '2', titulo: 'Sass', prioridad: ConocimientoPrioridad.BAJA },
];

const configurarApi = () => {
  apiMock.get.mockResolvedValue({ data: CONOCIMIENTOS });
  apiMock.post.mockImplementation((_url: string, payload: unknown) =>
    Promise.resolve({ data: { id: '3', ...(payload as object) } }),
  );
  apiMock.put.mockImplementation((url: string, payload: unknown) =>
    Promise.resolve({
      data: { id: url.split('/').pop(), ...(payload as object) },
    }),
  );
  apiMock.delete.mockImplementation((url: string) =>
    Promise.resolve({ data: { id: url.split('/').pop() } }),
  );
};

const renderPagina = async () => {
  const utils = renderConStore(<Conocimiento />);
  await flush();
  return utils;
};

describe('<Conocimiento />', () => {
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

  test('pinta tantas Cards como instancias devuelve api.get', async () => {
    await renderPagina();

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Sass')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);
  });

  test('la Card muestra la prioridad del conocimiento', async () => {
    await renderPagina();

    const subdatos = screen.getAllByText(
      (_, el) =>
        el?.firstElementChild?.tagName === 'B' &&
        /^Prioridad: /.test(el.textContent ?? ''),
    );

    expect(subdatos.map((el) => el.textContent)).toEqual([
      'Prioridad: Alta',
      'Prioridad: Baja',
    ]);
  });

  test('pinta el formulario con sus campos y sus botones', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Título:')).toBeInTheDocument();
    expect(screen.getByLabelText('Prioridad:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Borrar formulario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Crear Conocimiento' }),
    ).toBeInTheDocument();
  });

  test('el select de prioridad ofrece las cinco opciones en orden y por defecto Media', async () => {
    await renderPagina();

    const prioridad = screen.getByLabelText('Prioridad:');
    const opciones = Array.from(
      (prioridad as HTMLSelectElement).options,
      (o) => o.value,
    );

    expect(opciones).toEqual(['Muy alta', 'Alta', 'Media', 'Baja', 'Muy baja']);
    expect(prioridad).toHaveValue(ConocimientoPrioridad.MEDIA);
  });

  test('crear sin tocar el select envía prioridad Media y no nivel', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'TypeScript');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    const [, payload] = apiMock.post.mock.calls[0];
    expect(payload).toEqual({
      titulo: 'TypeScript',
      prioridad: ConocimientoPrioridad.MEDIA,
    });
    expect(payload).not.toHaveProperty('nivel');
  });

  test('«Borrar formulario» deja los campos en su valor por defecto', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');
    const prioridad = screen.getByLabelText('Prioridad:');

    await user.type(titulo, 'TypeScript');
    await user.selectOptions(prioridad, ConocimientoPrioridad.MUY_ALTA);
    expect(titulo).toHaveValue('TypeScript');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(titulo).toHaveValue('');
    expect(prioridad).toHaveValue(ConocimientoPrioridad.MEDIA);
  });

  test('crear llama a api.post, pinta la Card nueva y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'TypeScript');
    await user.selectOptions(
      screen.getByLabelText('Prioridad:'),
      ConocimientoPrioridad.ALTA,
    );
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
      titulo: 'TypeScript',
      prioridad: ConocimientoPrioridad.ALTA,
    });
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(3);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Conocimiento creado');
  });

  test('con un campo obligatorio vacío no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');
    expect(titulo).toHaveValue('');

    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    expect(apiMock.post).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
    expect(titulo).toBeInvalid();
  });

  test('«Editar» vuelca los datos de la Card en el formulario', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByLabelText('Título:')).toHaveValue('React');
    expect(screen.getByLabelText('Prioridad:')).toHaveValue(
      ConocimientoPrioridad.ALTA,
    );
    expect(
      screen.getByRole('heading', { name: 'Editar Conocimiento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
    ).toBeInTheDocument();
  });

  test('«Editar» + «Borrar formulario» limpia los campos y desacopla el id', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(screen.getByLabelText('Título:')).toHaveValue('');
    expect(screen.getByLabelText('Prioridad:')).toHaveValue(
      ConocimientoPrioridad.MEDIA,
    );
    expect(
      screen.getByRole('heading', { name: 'Crear Conocimiento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    ).toBeInTheDocument();
  });

  test('actualizar llama a api.put con el id correcto y refresca la Card', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const titulo = screen.getByLabelText('Título:');
    await user.clear(titulo);
    await user.type(titulo, 'React 19');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/conocimiento/1', {
      titulo: 'React 19',
      prioridad: ConocimientoPrioridad.ALTA,
    });
    expect(screen.getByText('React 19')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Conocimiento actualizado');
  });

  test('«Eliminar» llama a api.delete y quita la Card del listado', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalledWith('/conocimiento/1');
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.getByText('Sass')).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Conocimiento eliminado');
  });
  test('si api.post falla no se pinta Card nueva y avisa del error', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'TypeScript');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalled();
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('si api.put falla la Card no cambia y avisa del error', async () => {
    const user = setupUser();
    apiMock.put.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const titulo = screen.getByLabelText('Título:');
    await user.clear(titulo);
    await user.type(titulo, 'React 19');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalled();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('React 19')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('si api.delete falla la Card sigue en el listado y avisa del error', async () => {
    const user = setupUser();
    apiMock.delete.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalled();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('si api.get falla avisa del error', async () => {
    apiMock.get.mockRejectedValue(new Error('boom'));
    await renderPagina();

    expect(screen.queryAllByRole('button', { name: 'Editar' })).toHaveLength(0);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('con loading en el store pinta «Cargando...»', async () => {
    renderConStore(<Conocimiento />, {
      conocimiento: { conocimiento: null, loading: true, error: null },
    });

    expect(
      screen.getByRole('img', { name: 'Cargando...' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });
});
