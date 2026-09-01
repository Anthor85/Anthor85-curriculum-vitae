import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  avanzarMensaje,
  flush,
  renderConStore,
  textoMensaje,
} from '../utils';
import {
  Conocimiento as IConocimiento,
  ConocimientoNivel,
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
  { id: '1', titulo: 'React', nivel: ConocimientoNivel.AVANZADO },
  { id: '2', titulo: 'Sass', nivel: ConocimientoNivel.INTERMEDIO },
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

  test('pinta el formulario con sus campos y sus botones', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Título:')).toBeInTheDocument();
    expect(screen.getByLabelText('Nivel:')).toBeInTheDocument();
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

  test('«Borrar formulario» deja los campos en su valor por defecto', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');
    const nivel = screen.getByLabelText('Nivel:');

    await user.type(titulo, 'TypeScript');
    await user.selectOptions(nivel, ConocimientoNivel.AVANZADO);
    expect(titulo).toHaveValue('TypeScript');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(titulo).toHaveValue('');
    expect(nivel).toHaveValue(ConocimientoNivel.BASICO);
  });

  test('crear llama a api.post, pinta la Card nueva y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'TypeScript');
    await user.selectOptions(
      screen.getByLabelText('Nivel:'),
      ConocimientoNivel.AVANZADO,
    );
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
      titulo: 'TypeScript',
      nivel: ConocimientoNivel.AVANZADO,
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
    expect(screen.getByLabelText('Nivel:')).toHaveValue(
      ConocimientoNivel.AVANZADO,
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
    expect(screen.getByLabelText('Nivel:')).toHaveValue(
      ConocimientoNivel.BASICO,
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
      nivel: ConocimientoNivel.AVANZADO,
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
  test('si api.post falla no se pinta Card nueva ni mensaje', async () => {
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
    expect(textoMensaje()).toBe('');
  });

  test('si api.put falla la Card no cambia ni hay mensaje', async () => {
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
    expect(textoMensaje()).toBe('');
  });

  test('si api.delete falla la Card sigue en el listado y no hay mensaje', async () => {
    const user = setupUser();
    apiMock.delete.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalled();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('con loading en el store pinta «Loading...»', async () => {
    renderConStore(<Conocimiento />, {
      conocimiento: { conocimiento: [], loading: true, error: null },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });

  test('con error en el store pinta el error', async () => {
    renderConStore(<Conocimiento />, {
      conocimiento: { conocimiento: [], loading: false, error: 'Vaya' },
    });

    expect(screen.getByText('Error: Vaya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });
});
