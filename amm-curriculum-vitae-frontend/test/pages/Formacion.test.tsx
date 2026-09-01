import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  avanzarMensaje,
  flush,
  renderConStore,
  textoMensaje,
} from '../utils';
import { Formacion as IFormacion } from '../../src/interfaces/formacion.interface';

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

import { Formacion } from '../../src/pages/Formacion';

const FORMACIONES: IFormacion[] = [
  {
    id: '1',
    titulo: 'Ingeniería Informática',
    institucion: 'Universidad de Valencia',
    descripcion: 'Especialidad en software',
    fechaFin: '2015-06-30',
  },
  {
    id: '2',
    titulo: 'Grado Superior DAM',
    institucion: 'IES Camp de Morvedre',
    descripcion: '',
    fechaFin: '2011-06-30',
  },
];

const configurarApi = () => {
  apiMock.get.mockResolvedValue({ data: FORMACIONES });
  apiMock.post.mockImplementation((_url: string, payload: unknown) =>
    Promise.resolve({ data: { id: '3', ...(payload as object) } }),
  );
  apiMock.put.mockImplementation((url: string, payload: unknown) =>
    Promise.resolve({
      data: { id: url.split('/').pop(), ...(payload as object) },
    }),
  );
  // DELETE /formacion responde { msg, formacion } y el hook lee
  // data.formacion.id, no data.id.
  apiMock.delete.mockImplementation((url: string) =>
    Promise.resolve({ data: { formacion: { id: url.split('/').pop() } } }),
  );
};

const renderPagina = async () => {
  const utils = renderConStore(<Formacion />);
  await flush();
  return utils;
};

// Los input type="date" no responden bien a user.type en jsdom.
const escribirFecha = (campo: HTMLElement, valor: string) =>
  fireEvent.change(campo, { target: { value: valor } });

describe('<Formacion />', () => {
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

    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(screen.getByText('Grado Superior DAM')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);
  });

  test('pinta el formulario con sus campos y sus botones', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Título:')).toBeInTheDocument();
    expect(screen.getByLabelText('Institución:')).toBeInTheDocument();
    expect(screen.getByLabelText('A tener en cuenta:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Fin:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Formación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Borrar formulario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Crear Formación' }),
    ).toBeInTheDocument();
  });

  test('«Borrar formulario» deja todos los campos vacíos', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');
    const institucion = screen.getByLabelText('Institución:');
    const fechaFin = screen.getByLabelText('Fecha de Fin:');

    await user.type(titulo, 'Máster en IA');
    await user.type(institucion, 'UNED');
    escribirFecha(fechaFin, '2024-06-30');
    expect(titulo).toHaveValue('Máster en IA');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(titulo).toHaveValue('');
    expect(institucion).toHaveValue('');
    expect(screen.getByLabelText('A tener en cuenta:')).toHaveValue('');
    expect(fechaFin).toHaveValue('');
  });

  test('crear llama a api.post, pinta la Card nueva y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'Máster en IA');
    await user.type(screen.getByLabelText('Institución:'), 'UNED');
    escribirFecha(screen.getByLabelText('Fecha de Fin:'), '2024-06-30');
    await user.click(screen.getByRole('button', { name: 'Agregar Formación' }));

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/formacion', {
      titulo: 'Máster en IA',
      institucion: 'UNED',
      descripcion: '',
      fechaFin: '2024-06-30',
    });
    expect(screen.getByText('Máster en IA')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(3);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación creada');
  });

  test('con un campo obligatorio vacío no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');

    await user.type(screen.getByLabelText('Institución:'), 'UNED');
    escribirFecha(screen.getByLabelText('Fecha de Fin:'), '2024-06-30');
    await user.click(screen.getByRole('button', { name: 'Agregar Formación' }));

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

    expect(screen.getByLabelText('Título:')).toHaveValue(
      'Ingeniería Informática',
    );
    expect(screen.getByLabelText('Institución:')).toHaveValue(
      'Universidad de Valencia',
    );
    expect(screen.getByLabelText('A tener en cuenta:')).toHaveValue(
      'Especialidad en software',
    );
    expect(screen.getByLabelText('Fecha de Fin:')).toHaveValue('2015-06-30');
    expect(
      screen.getByRole('heading', { name: 'Editar Formación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Actualizar Formación' }),
    ).toBeInTheDocument();
  });

  test('«Editar» + «Borrar formulario» limpia los campos y desacopla el id', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(screen.getByLabelText('Título:')).toHaveValue('');
    expect(screen.getByLabelText('Institución:')).toHaveValue('');
    expect(screen.getByLabelText('A tener en cuenta:')).toHaveValue('');
    expect(screen.getByLabelText('Fecha de Fin:')).toHaveValue('');
    expect(
      screen.getByRole('heading', { name: 'Crear Formación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Formación' }),
    ).toBeInTheDocument();
  });

  test('actualizar llama a api.put con el id correcto y refresca la Card', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const titulo = screen.getByLabelText('Título:');
    await user.clear(titulo);
    await user.type(titulo, 'Ingeniería del Software');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Formación' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/formacion/1', {
      titulo: 'Ingeniería del Software',
      institucion: 'Universidad de Valencia',
      descripcion: 'Especialidad en software',
      fechaFin: '2015-06-30',
    });
    expect(screen.getByText('Ingeniería del Software')).toBeInTheDocument();
    expect(screen.queryByText('Ingeniería Informática')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación actualizada');
  });

  test('«Eliminar» llama a api.delete y quita la Card del listado', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalledWith('/formacion/1');
    expect(screen.queryByText('Ingeniería Informática')).not.toBeInTheDocument();
    expect(screen.getByText('Grado Superior DAM')).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación eliminada');
  });
  test('si api.post falla no se pinta Card nueva ni mensaje', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'Máster en IA');
    await user.type(screen.getByLabelText('Institución:'), 'UNED');
    escribirFecha(screen.getByLabelText('Fecha de Fin:'), '2024-06-30');
    await user.click(screen.getByRole('button', { name: 'Agregar Formación' }));

    await flush();

    expect(apiMock.post).toHaveBeenCalled();
    expect(screen.queryByText('Máster en IA')).not.toBeInTheDocument();
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
    await user.type(titulo, 'Ingeniería del Software');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Formación' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalled();
    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(
      screen.queryByText('Ingeniería del Software'),
    ).not.toBeInTheDocument();

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
    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('con loading en el store pinta «Loading...»', async () => {
    renderConStore(<Formacion />, {
      formacion: { formacion: null, loading: true, error: null },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });

  test('con error en el store pinta el error', async () => {
    renderConStore(<Formacion />, {
      formacion: { formacion: null, loading: false, error: 'Vaya' },
    });

    expect(screen.getByText('Error: Vaya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });
});
