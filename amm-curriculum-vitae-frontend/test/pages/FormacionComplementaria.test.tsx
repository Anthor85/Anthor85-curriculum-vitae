import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import { FormacionComplementaria as IFormacionComplementaria } from '../../src/interfaces/formacionComplementaria.interface';

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

import { FormacionComplementaria } from '../../src/pages/FormacionComplementaria';

const FORMACIONES: IFormacionComplementaria[] = [
  {
    id: '1',
    titulo: 'Curso de React',
    institucion: 'Platzi',
    fechaFin: '2022-03-15',
  },
  {
    id: '2',
    titulo: 'Curso de Docker',
    institucion: 'Udemy',
    fechaFin: '2021-11-20',
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
  // DELETE responde { msg, formacionComplementaria } y el hook lee
  // data.formacionComplementaria.id, no data.id.
  apiMock.delete.mockImplementation((url: string) =>
    Promise.resolve({
      data: { formacionComplementaria: { id: url.split('/').pop() } },
    }),
  );
};

const renderPagina = async () => {
  const utils = renderConStore(<FormacionComplementaria />);
  await flush();
  return utils;
};

// Los input type="date" no responden bien a user.type en jsdom.
const escribirFecha = (campo: HTMLElement, valor: string) =>
  fireEvent.change(campo, { target: { value: valor } });

describe('<FormacionComplementaria />', () => {
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

    expect(screen.getByText('Curso de React')).toBeInTheDocument();
    expect(screen.getByText('Curso de Docker')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2);
  });

  test('pinta el formulario con sus campos y sus botones', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Título:')).toBeInTheDocument();
    expect(screen.getByLabelText('Institución:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Fin:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Formación Complementaria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Borrar formulario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Crear Formación Complementaria' }),
    ).toBeInTheDocument();
  });

  test('«Borrar formulario» deja todos los campos vacíos', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');
    const institucion = screen.getByLabelText('Institución:');
    const fechaFin = screen.getByLabelText('Fecha de Fin:');

    await user.type(titulo, 'Curso de Vitest');
    await user.type(institucion, 'Testing Library');
    escribirFecha(fechaFin, '2024-01-31');
    expect(titulo).toHaveValue('Curso de Vitest');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(titulo).toHaveValue('');
    expect(institucion).toHaveValue('');
    expect(fechaFin).toHaveValue('');
  });

  test('crear llama a api.post, pinta la Card nueva y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'Curso de Vitest');
    await user.type(screen.getByLabelText('Institución:'), 'Testing Library');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Formación Complementaria' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/formacionComplementaria', {
      titulo: 'Curso de Vitest',
      institucion: 'Testing Library',
      fechaFin: '',
    });
    expect(screen.getByText('Curso de Vitest')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(3);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación Complementaria creada');
  });

  test('con un campo obligatorio vacío no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título:');

    await user.type(screen.getByLabelText('Institución:'), 'Testing Library');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Formación Complementaria' }),
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

    expect(screen.getByLabelText('Título:')).toHaveValue('Curso de React');
    expect(screen.getByLabelText('Institución:')).toHaveValue('Platzi');
    expect(screen.getByLabelText('Fecha de Fin:')).toHaveValue('2022-03-15');
    expect(
      screen.getByRole('heading', { name: 'Editar Formación Complementaria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Actualizar Formación Complementaria',
      }),
    ).toBeInTheDocument();
  });

  test('«Editar» + «Borrar formulario» limpia los campos y desacopla el id', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(screen.getByLabelText('Título:')).toHaveValue('');
    expect(screen.getByLabelText('Institución:')).toHaveValue('');
    expect(screen.getByLabelText('Fecha de Fin:')).toHaveValue('');
    expect(
      screen.getByRole('heading', { name: 'Crear Formación Complementaria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Formación Complementaria' }),
    ).toBeInTheDocument();
  });

  test('actualizar llama a api.put con el id correcto y refresca la Card', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const titulo = screen.getByLabelText('Título:');
    await user.clear(titulo);
    await user.type(titulo, 'Curso de React 19');
    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar Formación Complementaria',
      }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/formacionComplementaria/1', {
      titulo: 'Curso de React 19',
      institucion: 'Platzi',
      fechaFin: '2022-03-15',
    });
    expect(screen.getByText('Curso de React 19')).toBeInTheDocument();
    expect(screen.queryByText('Curso de React')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación Complementaria actualizada');
  });

  test('«Eliminar» llama a api.delete y quita la Card del listado', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalledWith('/formacionComplementaria/1');
    expect(screen.queryByText('Curso de React')).not.toBeInTheDocument();
    expect(screen.getByText('Curso de Docker')).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación Complementaria eliminada');
  });
  test('si api.post falla no se pinta Card nueva ni mensaje', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.type(screen.getByLabelText('Título:'), 'Curso de Vitest');
    await user.type(screen.getByLabelText('Institución:'), 'Testing Library');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Formación Complementaria' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalled();
    expect(screen.queryByText('Curso de Vitest')).not.toBeInTheDocument();
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
    await user.type(titulo, 'Curso de React 19');
    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar Formación Complementaria',
      }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalled();
    expect(screen.getByText('Curso de React')).toBeInTheDocument();
    expect(screen.queryByText('Curso de React 19')).not.toBeInTheDocument();

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
    expect(screen.getByText('Curso de React')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('con loading en el store pinta «Loading...»', async () => {
    renderConStore(<FormacionComplementaria />, {
      formacionComplementaria: {
        formacionComplementaria: null,
        loading: true,
        error: null,
      },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });

  test('con error en el store pinta el error', async () => {
    renderConStore(<FormacionComplementaria />, {
      formacionComplementaria: {
        formacionComplementaria: null,
        loading: false,
        error: 'Vaya',
      },
    });

    expect(screen.getByText('Error: Vaya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });
});
