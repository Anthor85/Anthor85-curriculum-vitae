import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import { Experiencia as IExperiencia } from '../../src/interfaces/experiencia.interface';

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

import { Experiencia } from '../../src/pages/Experiencia';

const EXPERIENCIAS: IExperiencia[] = [
  {
    id: '1',
    empresa: 'Acme',
    descripcion: 'Frontend Developer',
    fechaInicio: '2020-01-15',
    fechaFin: '2022-06-30',
    tecnologias: ['t1'],
    hitos: [{ id: 'h1', descripcion: 'Migración a React 19', experiencia: '1' }],
  },
  {
    id: '2',
    empresa: 'Globex',
    descripcion: 'Fullstack Developer',
    fechaInicio: '2022-07-01',
    fechaFin: '',
    tecnologias: [],
    hitos: [],
  },
];

const configurarApi = () => {
  // /conocimiento responde [] para que el form pinte "No hay tecnologías
  // disponibles" y no aparezca el MultiSelect.
  apiMock.get.mockImplementation((url: string) =>
    Promise.resolve({ data: url === '/experiencia' ? EXPERIENCIAS : [] }),
  );
  apiMock.post.mockImplementation((_url: string, payload: unknown) =>
    Promise.resolve({ data: { id: '3', ...(payload as object) } }),
  );
  apiMock.put.mockImplementation((url: string, payload: unknown) =>
    Promise.resolve({
      data: { ...(payload as object), id: url.split('/').pop() },
    }),
  );
  // DELETE responde { msg, experiencia, hitosEliminados } y el hook lee
  // data.experiencia.id, no data.id.
  apiMock.delete.mockImplementation((url: string) =>
    Promise.resolve({ data: { experiencia: { id: url.split('/').pop() } } }),
  );
};

const renderPagina = async () => {
  const utils = renderConStore(<Experiencia />);
  await flush();
  return utils;
};

// Los input type="date" no responden bien a user.type en jsdom.
const escribirFecha = (campo: HTMLElement, valor: string) =>
  fireEvent.change(campo, { target: { value: valor } });

describe('<Experiencia />', () => {
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

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
  });

  test('pinta el formulario con sus campos y sus botones', async () => {
    await renderPagina();

    expect(screen.getByLabelText('Company:')).toBeInTheDocument();
    expect(screen.getByLabelText('Posición:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha inicio:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha fin:')).toBeInTheDocument();
    expect(screen.getByText('No hay tecnologías disponibles')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Borrar formulario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Crear Experiencia' }),
    ).toBeInTheDocument();
  });

  test('«Borrar formulario» deja todos los campos vacíos', async () => {
    const user = setupUser();
    await renderPagina();

    const empresa = screen.getByLabelText('Company:');
    const posicion = screen.getByLabelText('Posición:');
    const fechaInicio = screen.getByLabelText('Fecha inicio:');

    await user.type(empresa, 'Initech');
    await user.type(posicion, 'Tech Lead');
    escribirFecha(fechaInicio, '2023-02-01');
    expect(empresa).toHaveValue('Initech');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(empresa).toHaveValue('');
    expect(posicion).toHaveValue('');
    expect(fechaInicio).toHaveValue('');
    expect(screen.getByLabelText('Fecha fin:')).toHaveValue('');
  });

  test('crear llama a api.post, pinta la Card nueva y muestra el mensaje', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/experiencia', {
      empresa: 'Initech',
      descripcion: 'Tech Lead',
      fechaInicio: '2023-02-01',
      fechaFin: '',
      tecnologias: [],
      hitos: [],
    });
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(3);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Experiencia creada');
  });

  test('con un campo obligatorio vacío no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const empresa = screen.getByLabelText('Company:');

    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );

    expect(apiMock.post).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
    expect(empresa).toBeInvalid();
  });

  test('«Editar» vuelca los datos de la Card en el formulario', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByLabelText('Company:')).toHaveValue('Acme');
    expect(screen.getByLabelText('Posición:')).toHaveValue(
      'Frontend Developer',
    );
    expect(screen.getByLabelText('Fecha inicio:')).toHaveValue('2020-01-15');
    expect(screen.getByLabelText('Fecha fin:')).toHaveValue('2022-06-30');
    expect(
      screen.getByRole('heading', { name: 'Editar Experiencia' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Actualizar Experiencia' }),
    ).toBeInTheDocument();
  });

  test('«Editar» + «Borrar formulario» limpia los campos y desacopla el id', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(screen.getByLabelText('Company:')).toHaveValue('');
    expect(screen.getByLabelText('Posición:')).toHaveValue('');
    expect(screen.getByLabelText('Fecha inicio:')).toHaveValue('');
    expect(screen.getByLabelText('Fecha fin:')).toHaveValue('');
    expect(
      screen.getByRole('heading', { name: 'Crear Experiencia' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    ).toBeInTheDocument();
  });

  test('actualizar llama a api.put con el id correcto y refresca la Card', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const empresa = screen.getByLabelText('Company:');
    await user.clear(empresa);
    await user.type(empresa, 'Acme Corp');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Experiencia' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/experiencia/1', {
      id: '1',
      empresa: 'Acme Corp',
      descripcion: 'Frontend Developer',
      fechaInicio: '2020-01-15',
      fechaFin: '2022-06-30',
      tecnologias: ['t1'],
      hitos: [{ id: 'h1', descripcion: 'Migración a React 19' }],
    });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Experiencia actualizada');
  });

  test('«Delete» llama a api.delete y quita la Card del listado', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalledWith('/experiencia/1');
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Experiencia eliminada');
  });
  test('si api.post falla no se pinta Card nueva ni mensaje', async () => {
    const user = setupUser();
    apiMock.post.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalled();
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('si api.put falla la Card no cambia ni hay mensaje', async () => {
    const user = setupUser();
    apiMock.put.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    const empresa = screen.getByLabelText('Company:');
    await user.clear(empresa);
    await user.type(empresa, 'Acme Corp');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Experiencia' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalled();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('si api.delete falla la Card sigue en el listado y no hay mensaje', async () => {
    const user = setupUser();
    apiMock.delete.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalled();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('');
  });

  test('con loading en el store pinta «Loading...»', async () => {
    renderConStore(<Experiencia />, {
      experiencia: { experiencia: null, loading: true, error: null },
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Company:')).not.toBeInTheDocument();

    await flush();
  });

  test('con error en el store pinta el error', async () => {
    renderConStore(<Experiencia />, {
      experiencia: { experiencia: null, loading: false, error: 'Vaya' },
    });

    expect(screen.getByText('Error: Vaya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Company:')).not.toBeInTheDocument();

    await flush();
  });
});
