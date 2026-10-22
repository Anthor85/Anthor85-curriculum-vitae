import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderConStore } from '../utils';
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

const PERFIL: Perfil = {
  id: 'p1',
  nombre: 'Antonio',
  apellidos: 'Menéndez',
  email: 'antonio@menendez.com',
  telefono: '+34 666 555 444',
  direccion: 'Calle Mayor 5, Alicante',
  descripcion: 'Técnico en informática',
};

const renderCurriculum = (curriculum: ICurriculum = CURRICULUM) =>
  renderConStore(<Curriculum />, {
    curriculum: { curriculum, loading: false, error: null },
  });

describe('<Curriculum />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
