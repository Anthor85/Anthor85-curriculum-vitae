import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { flush, renderConStore } from '../utils';
import i18n from '../../src/i18n';
import {
  ConocimientoPrioridad,
  type Conocimiento,
} from '../../src/interfaces/conocimiento.interface';
import type { Curriculum as ICurriculum } from '../../src/interfaces/curriculum.interface';
import type { Perfil } from '../../src/interfaces/perfil.interface';

const exportToPDFMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('../../src/helpers/exportToPDF', () => ({
  exportToPDF: exportToPDFMock,
}));

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../../src/api/api', () => ({ default: apiMock, api: apiMock }));

import { Curriculum } from '../../src/pages/Curriculum';

const conocimiento = (
  id: string,
  titulo: string,
  prioridad?: ConocimientoPrioridad,
): Conocimiento => ({ id, titulo, prioridad }) as Conocimiento;

const CURRICULUM: ICurriculum = {
  perfil: null,
  formaciones: [],
  formacionesComplementarias: [],
  conocimiento: [
    conocimiento('1', 'Sonata', ConocimientoPrioridad.MEDIA),
    conocimiento('2', 'Unity3D', ConocimientoPrioridad.ALTA),
    conocimiento('3', 'Cobol', ConocimientoPrioridad.MUY_BAJA),
    conocimiento('4', 'Ajax', ConocimientoPrioridad.MUY_ALTA),
    conocimiento('5', 'Java'),
    conocimiento('6', 'Pascal', ConocimientoPrioridad.BAJA),
    conocimiento('7', 'TypeScript', ConocimientoPrioridad.ALTA),
  ],
  experiencia: [
    {
      id: 'e1',
      empresa: 'Everis',
      descripcion: 'Desarrollador',
      fechaInicio: '2020-03-15T00:00:00',
      tecnologias: ['3', '1', '7', '4'],
      hitos: [],
    },
  ],
};

const ORDEN_ESPERADO = [
  'Ajax',
  'TypeScript',
  'Unity3D',
  'Java',
  'Sonata',
  'Pascal',
  'Cobol',
];

const PERFIL: Perfil<string> = {
  id: 'p1',
  nombre: 'Antonio',
  apellidos: 'Menéndez',
  email: 'antonio@menendez.com',
  telefono: '+34 666 555 444',
  direccion: 'Calle Mayor 5, Alicante',
  descripcion: 'Técnico en informática',
};

const renderCurriculum = (curriculum: ICurriculum = CURRICULUM) =>
  renderConStore(
    <MemoryRouter initialEntries={['/']}>
      <Curriculum />
    </MemoryRouter>,
    {
      curriculum: {
        curriculums: { es: curriculum, en: null },
        loading: false,
        error: null,
      },
    },
  );

// Arranca en `ruta` con los currículums indicados ya en el store
const renderEn = (
  ruta: string,
  curriculums: { es: ICurriculum | null; en: ICurriculum | null },
) =>
  renderConStore(
    <MemoryRouter initialEntries={[ruta]}>
      <Curriculum />
    </MemoryRouter>,
    { curriculum: { curriculums, loading: false, error: null } },
  );

const CURRICULUM_EN: ICurriculum = {
  ...CURRICULUM,
  experiencia: [{ ...CURRICULUM.experiencia[0], descripcion: 'Developer' }],
};

describe('<Curriculum />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Curriculum cambia el idioma del singleton de i18n: se restaura entre tests
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('es');
    });
    document.documentElement.lang = 'es';
  });

  test('la pestaña Conocimientos ordena por prioridad y alfabéticamente sin mostrar la prioridad', async () => {
    const user = userEvent.setup();
    renderCurriculum();

    await user.click(screen.getByRole('tab', { name: 'Conocimientos' }));
    const panel = screen.getByRole('tabpanel');

    expect(
      within(panel)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(ORDEN_ESPERADO);
    Object.values(ConocimientoPrioridad).forEach((texto) =>
      expect(within(panel).queryByText(texto)).not.toBeInTheDocument(),
    );
    expect(panel.innerHTML).not.toMatch(/prioridad/i);
  });

  test('las tecnologías de una experiencia siguen el orden por prioridad', () => {
    renderCurriculum();

    const panel = screen.getByRole('tabpanel');
    const tecnologias = within(panel)
      .getAllByRole('listitem', { hidden: true })
      .map((li) => li.textContent);

    expect(tecnologias).toEqual(['Ajax', 'TypeScript', 'Sonata', 'Cobol']);
  });

  test('el PDF recibe los conocimientos ya ordenados', async () => {
    const user = userEvent.setup();
    renderCurriculum();

    await user.click(screen.getByRole('button', { name: /Descargar CV/ }));

    expect(exportToPDFMock).toHaveBeenCalledTimes(1);
    const [datos] = exportToPDFMock.mock.calls[0] as unknown as [
      { conocimiento: Conocimiento[] },
    ];
    expect(datos.conocimiento.map((c) => c.titulo)).toEqual(ORDEN_ESPERADO);
  });

  test('hay un único h1 con nombre y apellidos del perfil', () => {
    renderCurriculum({ ...CURRICULUM, perfil: PERFIL });

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('Antonio Menéndez');
  });

  test('expone los landmarks main y header', () => {
    const { container } = renderCurriculum({ ...CURRICULUM, perfil: PERFIL });

    expect(screen.getByRole('main')).toBeInTheDocument();
    // Un <header> dentro de <main> no expone el rol banner: se busca por etiqueta
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  test('la pestaña Experiencia expone un h3 con el nombre de la empresa', () => {
    renderCurriculum();

    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel).getByRole('heading', { level: 3, name: /Everis/ }),
    ).toBeInTheDocument();
  });

  test('la pestaña Formación Académica lista los extras de cada formación', async () => {
    const user = userEvent.setup();
    renderCurriculum({
      ...CURRICULUM,
      formaciones: [
        {
          id: 'f1',
          titulo: 'Ingeniería Informática',
          institucion: 'UPV',
          fechaFin: '2015-06-30',
          extras: [
            { id: 'x1', descripcion: 'Rama de software', formacion: 'f1' },
            { id: 'x2', descripcion: 'Premio extraordinario', formacion: 'f1' },
          ],
        },
      ],
    });

    await user.click(screen.getByRole('tab', { name: 'Formación Académica' }));
    const panel = screen.getByRole('tabpanel');

    expect(
      within(panel)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Rama de software', 'Premio extraordinario']);
  });

  test('en /en pide el currículum con lang=en y pinta los textos fijos en inglés', async () => {
    apiMock.get.mockResolvedValue({ data: CURRICULUM_EN });
    renderEn('/en', { es: CURRICULUM, en: null });
    await flush();

    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(apiMock.get).toHaveBeenCalledWith('/curriculum', {
      params: { lang: 'en' },
    });
    expect(screen.getByRole('tab', { name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Skills' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Download CV/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  test('el selector son enlaces con hrefLang y marca el idioma activo', async () => {
    renderEn('/en', { es: CURRICULUM, en: CURRICULUM_EN });
    await flush();

    const selector = screen.getByRole('navigation', { name: 'Language' });
    const es = within(selector).getByRole('link', { name: 'Español' });
    const en = within(selector).getByRole('link', { name: 'English' });

    expect(es).toHaveAttribute('href', '/');
    expect(es).toHaveAttribute('hreflang', 'es');
    expect(es).not.toHaveAttribute('aria-current');
    expect(en).toHaveAttribute('href', '/en');
    expect(en).toHaveAttribute('hreflang', 'en');
    expect(en).toHaveAttribute('aria-current', 'page');
  });

  test('cambiar de idioma pide solo el que falta y volver no repite la petición', async () => {
    const user = userEvent.setup();
    apiMock.get.mockResolvedValue({ data: CURRICULUM_EN });
    renderEn('/', { es: CURRICULUM, en: null });
    await flush();

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(
      screen.getByRole('tab', { name: 'Experiencia' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'English' }));
    await flush();

    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tab', { name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('link', { name: 'Español' }));
    await flush();
    await user.click(screen.getByRole('link', { name: 'English' }));
    await flush();

    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  test('el PDF exportado desde /en sale en inglés', async () => {
    const user = userEvent.setup();
    renderEn('/en', {
      es: null,
      en: { ...CURRICULUM_EN, perfil: PERFIL },
    });
    await flush();

    await user.click(screen.getByRole('button', { name: /Download CV/ }));

    const [datos, nombre] = exportToPDFMock.mock.calls[0] as unknown as [
      { idioma: string; t: (clave: string) => string },
      string,
    ];
    expect(datos.idioma).toBe('en');
    expect(datos.t('pdf.experiencia')).toBe('Experience');
    expect(nombre).toBe('CV Antonio Menéndez');
  });
});
