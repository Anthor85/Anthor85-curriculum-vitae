import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
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
    fechaFin: '2015-06-30',
    extras: [
      { id: 'x1', descripcion: 'Especialidad en software', formacion: '1' },
    ],
  },
  {
    id: '2',
    titulo: 'Grado Superior DAM',
    institucion: 'IES Camp de Morvedre',
    fechaFin: '2011-06-30',
    extras: [],
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

const inputsExtra = () =>
  screen
    .queryAllByRole('textbox')
    .filter(
      (input) => input.getAttribute('name') === 'extras',
    ) as HTMLInputElement[];

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
    expect(screen.getByRole('group', { name: 'Extra:' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Fin:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Añadir extra' }),
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[0], 'Especialización en Machine Learning');
    escribirFecha(fechaFin, '2024-06-30');
    expect(titulo).toHaveValue('Máster en IA');

    await user.click(screen.getByRole('button', { name: 'Borrar formulario' }));

    expect(titulo).toHaveValue('');
    expect(institucion).toHaveValue('');
    expect(inputsExtra()).toHaveLength(0);
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
      fechaFin: '2024-06-30',
      extras: [],
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
    expect(inputsExtra()).toHaveLength(1);
    expect(inputsExtra()[0]).toHaveValue('Especialidad en software');
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
    expect(inputsExtra()).toHaveLength(0);
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
      fechaFin: '2015-06-30',
      extras: [{ id: 'x1', descripcion: 'Especialidad en software' }],
    });
    expect(screen.getByText('Ingeniería del Software')).toBeInTheDocument();
    expect(
      screen.queryByText('Ingeniería Informática'),
    ).not.toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación actualizada');
  });

  test('la Card pinta los extras de la formación y nada si no tiene', async () => {
    await renderPagina();

    // «Extra:» es un <span> en el form siempre y un <p> en la Card: solo la
    // primera formación tiene extras, así que solo hay un <p>.
    const titulosEnCards = screen
      .getAllByText('Extra:')
      .filter((el) => el.tagName === 'P');
    expect(titulosEnCards).toHaveLength(1);
    expect(screen.getByText('Especialidad en software')).toBeInTheDocument();
  });

  test('«+ Añadir extra» añade filas y el post recoge las descripciones', async () => {
    const user = setupUser();
    await renderPagina();

    expect(inputsExtra()).toHaveLength(0);

    await user.type(screen.getByLabelText('Título:'), 'Máster en IA');
    await user.type(screen.getByLabelText('Institución:'), 'UNED');
    escribirFecha(screen.getByLabelText('Fecha de Fin:'), '2024-06-30');
    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[0], 'Primer extra');
    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[1], 'Segundo extra');
    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[2], '   ');
    await user.click(screen.getByRole('button', { name: 'Agregar Formación' }));

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith(
      '/formacion',
      expect.objectContaining({
        extras: [
          { descripcion: 'Primer extra' },
          { descripcion: 'Segundo extra' },
        ],
      }),
    );
  });

  test('la «X» de un extra borra solo esa fila', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[0], 'Primer extra');
    await user.click(screen.getByRole('button', { name: '+ Añadir extra' }));
    await user.type(inputsExtra()[1], 'Segundo extra');

    const primeraFila = inputsExtra()[0].parentElement as HTMLElement;
    await user.click(
      within(primeraFila).getByRole('button', { name: 'Borrar extra 1' }),
    );

    expect(inputsExtra()).toHaveLength(1);
    expect(inputsExtra()[0]).toHaveValue('Segundo extra');
  });

  test('«Editar» una formación sin extras deja una fila en blanco', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[1]);

    expect(inputsExtra()).toHaveLength(1);
    expect(inputsExtra()[0]).toHaveValue('');
  });

  test('«Eliminar» llama a api.delete y quita la Card del listado', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalledWith('/formacion/1');
    expect(
      screen.queryByText('Ingeniería Informática'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Grado Superior DAM')).toBeInTheDocument();

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Formación eliminada');
  });
  test('si api.post falla no se pinta Card nueva y avisa del error', async () => {
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
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('si api.put falla la Card no cambia y avisa del error', async () => {
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
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('si api.delete falla la Card sigue en el listado y avisa del error', async () => {
    const user = setupUser();
    apiMock.delete.mockRejectedValue(new Error('boom'));
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await flush();

    expect(apiMock.delete).toHaveBeenCalled();
    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Ha ocurrido un error inesperado');
  });

  test('con loading en el store pinta «Cargando...»', async () => {
    renderConStore(<Formacion />, {
      formacion: { formacion: null, loading: true, error: null },
    });

    expect(
      screen.getByRole('img', { name: 'Cargando...' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Título:')).not.toBeInTheDocument();

    await flush();
  });
});
