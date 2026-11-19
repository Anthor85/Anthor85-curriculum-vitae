import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { avanzarMensaje, flush, renderConStore, textoMensaje } from '../utils';
import { errorAxios } from '../utils/errores';
import {
  Conocimiento as IConocimiento,
  ConocimientoPrioridad,
  type ResultadoIcono,
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

const loc = (es: string, en = '') => ({ es, en });

const CONOCIMIENTOS: IConocimiento[] = [
  { id: '1', titulo: loc('React'), prioridad: ConocimientoPrioridad.ALTA },
  { id: '2', titulo: loc('Sass'), prioridad: ConocimientoPrioridad.BAJA },
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

    expect(screen.getByLabelText('Título (ES)')).toBeInTheDocument();
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
      (o) => [o.value, o.textContent],
    );

    expect(opciones).toEqual([
      ['muyAlta', 'Muy alta'],
      ['alta', 'Alta'],
      ['media', 'Media'],
      ['baja', 'Baja'],
      ['muyBaja', 'Muy baja'],
    ]);
    expect(prioridad).toHaveValue(ConocimientoPrioridad.MEDIA);
  });

  test('crear sin tocar el select envía prioridad Media y no nivel', async () => {
    const user = setupUser();
    await renderPagina();

    await user.type(screen.getByLabelText('Título (ES)'), 'TypeScript');
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    const [, payload] = apiMock.post.mock.calls[0];
    expect(payload).toEqual({
      titulo: loc('TypeScript'),
      prioridad: ConocimientoPrioridad.MEDIA,
      icono: '',
    });
    expect(payload).not.toHaveProperty('nivel');
  });

  test('«Borrar formulario» deja los campos en su valor por defecto', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título (ES)');
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

    await user.type(screen.getByLabelText('Título (ES)'), 'TypeScript');
    await user.selectOptions(
      screen.getByLabelText('Prioridad:'),
      ConocimientoPrioridad.ALTA,
    );
    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );

    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
      titulo: loc('TypeScript'),
      prioridad: ConocimientoPrioridad.ALTA,
      icono: '',
    });
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(3);

    await avanzarMensaje();
    expect(textoMensaje()).toBe('Conocimiento creado');
  });

  test('con un campo obligatorio vacío no se crea nada', async () => {
    const user = setupUser();
    await renderPagina();

    const titulo = screen.getByLabelText('Título (ES)');
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

    expect(screen.getByLabelText('Título (ES)')).toHaveValue('React');
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

    expect(screen.getByLabelText('Título (ES)')).toHaveValue('');
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

    const titulo = screen.getByLabelText('Título (ES)');
    await user.clear(titulo);
    await user.type(titulo, 'React 19');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
    );

    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/conocimiento/1', {
      titulo: loc('React 19'),
      prioridad: ConocimientoPrioridad.ALTA,
      icono: '',
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

    await user.type(screen.getByLabelText('Título (ES)'), 'TypeScript');
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

    const titulo = screen.getByLabelText('Título (ES)');
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
    expect(screen.queryByLabelText('Título (ES)')).not.toBeInTheDocument();

    await flush();
  });

  test('«Editar» carga el título en los dos idiomas y actualizar envía { es, en }', async () => {
    const user = setupUser();
    apiMock.get.mockResolvedValue({
      data: [
        {
          id: '1',
          titulo: loc('Pruebas unitarias', 'Unit tests'),
          prioridad: ConocimientoPrioridad.ALTA,
        },
      ],
    });
    await renderPagina();

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Título (ES)')).toHaveValue(
      'Pruebas unitarias',
    );
    const en = screen.getByLabelText('Título (EN)');
    expect(en).toHaveValue('Unit tests');

    await user.clear(en);
    await user.type(en, ' Unit testing ');
    await user.click(
      screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
    );
    await flush();

    expect(apiMock.put).toHaveBeenCalledWith('/conocimiento/1', {
      titulo: loc('Pruebas unitarias', 'Unit testing'),
      prioridad: ConocimientoPrioridad.ALTA,
      icono: '',
    });
  });

  test('«Sugerir EN» rellena el título EN y viaja en el payload', async () => {
    const user = setupUser();
    await renderPagina();
    apiMock.post.mockImplementation((url: string, payload: unknown) =>
      Promise.resolve({
        data:
          url === '/traduccion'
            ? { textos: ['Agile methodologies'] }
            : { id: '3', ...(payload as object) },
      }),
    );

    await user.type(
      screen.getByLabelText('Título (ES)'),
      'Metodologías ágiles',
    );
    await user.click(screen.getByRole('button', { name: 'Sugerir EN' }));
    await flush();

    expect(apiMock.post).toHaveBeenCalledWith('/traduccion', {
      textos: ['Metodologías ágiles'],
    });
    expect(screen.getByLabelText('Título (EN)')).toHaveValue(
      'Agile methodologies',
    );

    await user.click(
      screen.getByRole('button', { name: 'Agregar Conocimiento' }),
    );
    await flush();

    expect(apiMock.post).toHaveBeenLastCalledWith('/conocimiento', {
      titulo: loc('Metodologías ágiles', 'Agile methodologies'),
      prioridad: ConocimientoPrioridad.MEDIA,
      icono: '',
    });
  });

  test('la Card muestra el título en español y no marca «Sin EN»', async () => {
    apiMock.get.mockResolvedValue({
      data: [
        {
          id: '1',
          titulo: loc('Pruebas unitarias', 'Unit testing'),
          prioridad: ConocimientoPrioridad.ALTA,
        },
        {
          id: '2',
          titulo: loc('Metodologías ágiles'),
          prioridad: ConocimientoPrioridad.MEDIA,
        },
      ],
    });
    await renderPagina();

    expect(screen.getByText('Pruebas unitarias')).toBeInTheDocument();
    expect(screen.queryByText('Unit testing')).not.toBeInTheDocument();
    expect(screen.getByText('Metodologías ágiles')).toBeInTheDocument();
    expect(screen.queryByText('Sin EN')).not.toBeInTheDocument();
  });

  describe('icono', () => {
    const SVG_REACT =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></svg>';
    const SVG_MONO =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text>R</text></svg>';
    const RESULTADOS: ResultadoIcono[] = [
      { nombre: 'React', fuente: 'simple-icons', icono: SVG_REACT },
      { nombre: 'R', fuente: 'monograma', icono: SVG_MONO },
    ];

    // GET /icono responde con `respuesta`; el resto, con `conocimientos`
    const responderIconos = (
      respuesta: () => Promise<unknown> = () =>
        Promise.resolve({ data: { resultados: RESULTADOS } }),
      conocimientos: IConocimiento[] = CONOCIMIENTOS,
    ) =>
      apiMock.get.mockImplementation((url: string) =>
        url === '/icono'
          ? respuesta()
          : Promise.resolve({ data: conocimientos }),
      );

    const CON_ICONO = [{ ...CONOCIMIENTOS[0], icono: SVG_REACT }];

    const previa = () => screen.getByTestId('icono-previa');
    const estiloPrevia = () =>
      previa().querySelector('[aria-hidden]')?.getAttribute('style') ?? '';
    const botonResultado = (nombre: string) =>
      screen.getByRole('button', { name: `Usar icono ${nombre}` });
    const hayResultados = () =>
      screen.queryAllByRole('button', { name: /^Usar icono/ }).length > 0;

    test('el formulario muestra vista previa, Buscar icono, edición manual y Quitar icono', async () => {
      await renderPagina();

      expect(previa()).toHaveTextContent('Sin icono');
      expect(
        screen.getByRole('button', { name: 'Buscar icono' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Quitar icono' }),
      ).toBeDisabled();
      expect(screen.getByText('Editar SVG a mano')).toBeInTheDocument();
      expect(screen.getByLabelText('SVG:')).toHaveValue('');
    });

    test('«Buscar icono» usa el título ES y muestra los resultados', async () => {
      const user = setupUser();
      responderIconos();
      await renderPagina();

      await user.type(screen.getByLabelText('Título (ES)'), ' React ');
      await user.type(screen.getByLabelText('Título (EN)'), 'Other');
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));
      await flush();

      expect(apiMock.get).toHaveBeenCalledWith('/icono', {
        params: { q: 'React' },
      });
      expect(botonResultado('React (simple-icons)')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(botonResultado('R (monograma)')).toBeInTheDocument();
    });

    test('«Buscar icono» se deshabilita mientras busca', async () => {
      const user = setupUser();
      let resolver: (valor: unknown) => void = () => {};
      responderIconos(() => new Promise((r) => (resolver = r)));
      await renderPagina();

      await user.type(screen.getByLabelText('Título (ES)'), 'React');
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));

      expect(screen.getByRole('button', { name: 'Buscando…' })).toBeDisabled();

      resolver({ data: { resultados: RESULTADOS } });
      await flush();

      expect(
        screen.getByRole('button', { name: 'Buscar icono' }),
      ).toBeEnabled();
    });

    test('elegir un resultado actualiza la vista previa, cierra la lista y viaja en el POST', async () => {
      const user = setupUser();
      responderIconos();
      await renderPagina();

      await user.type(screen.getByLabelText('Título (ES)'), 'React');
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));
      await flush();
      await user.click(botonResultado('React (simple-icons)'));

      expect(estiloPrevia()).toContain(encodeURIComponent(SVG_REACT));
      expect(previa()).not.toHaveTextContent('Sin icono');
      expect(hayResultados()).toBe(false);
      expect(screen.getByLabelText('SVG:')).toHaveValue(SVG_REACT);

      await user.click(
        screen.getByRole('button', { name: 'Agregar Conocimiento' }),
      );
      await flush();

      expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
        titulo: loc('React'),
        prioridad: ConocimientoPrioridad.MEDIA,
        icono: SVG_REACT,
      });
    });

    test('pegar en la textarea actualiza la vista previa y el payload lleva el SVG recortado', async () => {
      const user = setupUser();
      await renderPagina();

      await user.type(screen.getByLabelText('Título (ES)'), 'React');
      await user.click(screen.getByLabelText('SVG:'));
      await user.paste(`  ${SVG_MONO}\n`);

      expect(estiloPrevia()).toContain(encodeURIComponent(SVG_MONO));
      expect(
        screen.getByRole('button', { name: 'Quitar icono' }),
      ).toBeEnabled();

      await user.click(
        screen.getByRole('button', { name: 'Agregar Conocimiento' }),
      );
      await flush();

      expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
        titulo: loc('React'),
        prioridad: ConocimientoPrioridad.MEDIA,
        icono: SVG_MONO,
      });
    });

    test('«Editar» carga el icono guardado y «Quitar icono» envía icono vacío', async () => {
      const user = setupUser();
      apiMock.get.mockResolvedValue({ data: CON_ICONO });
      await renderPagina();

      await user.click(screen.getByRole('button', { name: 'Editar' }));

      expect(estiloPrevia()).toContain(encodeURIComponent(SVG_REACT));
      expect(screen.getByLabelText('SVG:')).toHaveValue(SVG_REACT);

      await user.click(screen.getByRole('button', { name: 'Quitar icono' }));

      expect(previa()).toHaveTextContent('Sin icono');
      expect(
        screen.getByRole('button', { name: 'Quitar icono' }),
      ).toBeDisabled();

      await user.click(
        screen.getByRole('button', { name: 'Actualizar Conocimiento' }),
      );
      await flush();

      expect(apiMock.put).toHaveBeenCalledWith('/conocimiento/1', {
        titulo: loc('React'),
        prioridad: ConocimientoPrioridad.ALTA,
        icono: '',
      });
    });

    test('al buscar con un icono ya elegido, el resultado igual queda marcado', async () => {
      const user = setupUser();
      responderIconos(undefined, CON_ICONO);
      await renderPagina();

      await user.click(screen.getByRole('button', { name: 'Editar' }));
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));
      await flush();

      expect(botonResultado('React (simple-icons)')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(botonResultado('R (monograma)')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    test('«Borrar formulario» limpia el icono y los resultados', async () => {
      const user = setupUser();
      responderIconos(undefined, CON_ICONO);
      await renderPagina();

      await user.click(screen.getByRole('button', { name: 'Editar' }));
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));
      await flush();
      expect(hayResultados()).toBe(true);

      await user.click(
        screen.getByRole('button', { name: 'Borrar formulario' }),
      );

      expect(previa()).toHaveTextContent('Sin icono');
      expect(screen.getByLabelText('SVG:')).toHaveValue('');
      expect(hayResultados()).toBe(false);
    });

    test.each([
      [502, 'Servicio de iconos no disponible'],
      [404, 'No se pudo buscar el icono'],
    ])('si la búsqueda falla con %i muestra «%s»', async (status, mensaje) => {
      const user = setupUser();
      responderIconos(() => Promise.reject(errorAxios(status)));
      await renderPagina();

      await user.type(screen.getByLabelText('Título (ES)'), 'React');
      await user.click(screen.getByRole('button', { name: 'Buscar icono' }));
      await flush();

      expect(screen.getByRole('alert')).toHaveTextContent(mensaje);
      expect(hayResultados()).toBe(false);
    });
  });
});
