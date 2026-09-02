import { fireEvent, screen, within } from '@testing-library/react';
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

const CONOCIMIENTO = [
  { id: 't1', titulo: 'React', nivel: 'Avanzado' },
  { id: 't2', titulo: 'TypeScript', nivel: 'Intermedio' },
];

// Variante de configurarApi con tecnologias: el form pinta el MultiSelect y la
// Card resuelve los ids de `tecnologias` contra los titulos del store.
const configurarApiConTecnologias = () => {
  apiMock.get.mockImplementation((url: string) =>
    Promise.resolve({
      data: url === '/experiencia' ? EXPERIENCIAS : CONOCIMIENTO,
    }),
  );
};

const renderPagina = async () => {
  const utils = renderConStore(<Experiencia />);
  await flush();
  return utils;
};

const renderPaginaConTecnologias = async () => {
  configurarApiConTecnologias();
  return renderPagina();
};

const inputsHito = () =>
  screen
    .queryAllByRole('textbox')
    .filter(
      (input) => input.getAttribute('name') === 'hitos',
    ) as HTMLInputElement[];

// Deja la promesa de la api en vuelo para poder assertar el estado pendiente
// del boton de envio antes de resolverla.
const promesaPendiente = <T,>() => {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
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

  test('la Card pinta el rango de fechas y «En la actualidad» sin fechaFin', async () => {
    await renderPagina();

    expect(screen.getByText('15/01/2020 - 30/06/2022')).toBeInTheDocument();
    expect(
      screen.getByText('01/07/2022 - En la actualidad'),
    ).toBeInTheDocument();
  });

  test('la Card pinta los hitos de la experiencia y nada si no tiene', async () => {
    await renderPagina();

    // «Hitos:» es un <label> en el form siempre y un <p> en la Card: solo Acme
    // tiene hitos, así que solo hay un <p>.
    const titulosEnCards = screen
      .getAllByText('Hitos:')
      .filter((el) => el.tagName === 'P');
    expect(titulosEnCards).toHaveLength(1);
    expect(screen.getByText('Migración a React 19')).toBeInTheDocument();
  });

  test('la Card resuelve los ids de tecnologías contra los títulos del store', async () => {
    await renderPaginaConTecnologias();

    // Acme tiene t1: se pinta «React» y no «TypeScript». Globex no tiene
    // tecnologías, así que su Card no pinta la sección.
    const listas = screen.getAllByRole('list');
    expect(within(listas[0]).getByText('React')).toBeInTheDocument();
    expect(within(listas[0]).queryByText('TypeScript')).not.toBeInTheDocument();
  });

  test('la Card con tecnologías que no están en el store no pinta títulos', async () => {
    apiMock.get.mockImplementation((url: string) =>
      Promise.resolve({
        data:
          url === '/experiencia'
            ? [{ ...EXPERIENCIAS[0], tecnologias: ['fantasma'], hitos: [] }]
            : CONOCIMIENTO,
      }),
    );
    await renderPagina();

    const seccion = screen.getAllByText('Tecnologías:')[0]
      .parentElement as HTMLElement;
    expect(within(seccion).queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('crear con tecnologías seleccionadas las manda en el post', async () => {
    const user = setupUser();
    await renderPaginaConTecnologias();

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');
    escribirFecha(screen.getByLabelText('Fecha fin:'), '2024-03-15');

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'React' }));
    await user.click(screen.getByRole('option', { name: 'TypeScript' }));
    // El chip de TypeScript se quita: solo debe viajar React.
    await user.click(screen.getByRole('button', { name: 'Quitar TypeScript' }));

    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );
    await flush();

    expect(apiMock.post).toHaveBeenCalledWith(
      '/experiencia',
      expect.objectContaining({ tecnologias: ['t1'], fechaFin: '2024-03-15' }),
    );
  });

  test('«+ Añadir hito» añade filas y el post recoge las descripciones', async () => {
    const user = setupUser();
    await renderPagina();

    expect(inputsHito()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '+ Añadir hito' }));
    await user.type(inputsHito()[0], 'Primer hito');
    await user.click(screen.getByRole('button', { name: '+ Añadir hito' }));
    await user.type(inputsHito()[1], 'Segundo hito');

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');

    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );
    await flush();

    expect(apiMock.post).toHaveBeenCalledWith(
      '/experiencia',
      expect.objectContaining({
        hitos: [
          { descripcion: 'Primer hito' },
          { descripcion: 'Segundo hito' },
        ],
      }),
    );
  });

  test('la «X» de un hito borra solo esa fila', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getByRole('button', { name: '+ Añadir hito' }));
    await user.type(inputsHito()[0], 'Primer hito');
    await user.click(screen.getByRole('button', { name: '+ Añadir hito' }));
    await user.type(inputsHito()[1], 'Segundo hito');

    const primeraFila = inputsHito()[0].parentElement as HTMLElement;
    await user.click(within(primeraFila).getByRole('button', { name: 'X' }));

    expect(inputsHito()).toHaveLength(1);
    expect(inputsHito()[0]).toHaveValue('Segundo hito');
  });

  test('los hitos en blanco no viajan en el post', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getByRole('button', { name: '+ Añadir hito' }));
    await user.type(inputsHito()[0], '   ');

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');

    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );
    await flush();

    expect(apiMock.post).toHaveBeenCalledWith(
      '/experiencia',
      expect.objectContaining({ hitos: [] }),
    );
  });

  test('«Editar» vuelca hitos y tecnologías en el formulario', async () => {
    const user = setupUser();
    await renderPaginaConTecnologias();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(inputsHito()).toHaveLength(1);
    expect(inputsHito()[0]).toHaveValue('Migración a React 19');
    expect(
      screen.getByRole('button', { name: 'Quitar React' }),
    ).toBeInTheDocument();
  });

  test('«Editar» una experiencia sin hitos deja una fila en blanco', async () => {
    const user = setupUser();
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[1]);

    expect(inputsHito()).toHaveLength(1);
    expect(inputsHito()[0]).toHaveValue('');
  });

  test('mientras el post está en vuelo el botón se deshabilita', async () => {
    const user = setupUser();
    const { promesa, resolver } = promesaPendiente<{ data: unknown }>();
    apiMock.post.mockReturnValue(promesa);
    await renderPagina();

    await user.type(screen.getByLabelText('Company:'), 'Initech');
    await user.type(screen.getByLabelText('Posición:'), 'Tech Lead');
    escribirFecha(screen.getByLabelText('Fecha inicio:'), '2023-02-01');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    );

    expect(screen.getByRole('button', { name: 'Agregando...' })).toBeDisabled();

    resolver({ data: { ...EXPERIENCIAS[0], id: '3', empresa: 'Initech' } });
    await flush();

    expect(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    ).toBeEnabled();
  });

  test('mientras el put está en vuelo el botón pone «Actualizando...»', async () => {
    const user = setupUser();
    const { promesa, resolver } = promesaPendiente<{ data: unknown }>();
    apiMock.put.mockReturnValue(promesa);
    await renderPagina();

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Experiencia' }),
    );

    expect(
      screen.getByRole('button', { name: 'Actualizando...' }),
    ).toBeDisabled();

    resolver({ data: { ...EXPERIENCIAS[0] } });
    await flush();

    expect(
      screen.getByRole('button', { name: 'Agregar Experiencia' }),
    ).toBeEnabled();
  });
});
