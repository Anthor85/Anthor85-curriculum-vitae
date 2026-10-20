import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

// react-pdf no renderiza en jsdom: sus primitivas se sustituyen por elementos
// DOM que conservan el texto, los enlaces y los metadatos
vi.mock('@react-pdf/renderer', () => ({
  Font: { registerHyphenationCallback: vi.fn() },
  StyleSheet: { create: <T,>(estilos: T) => estilos },
  Document: ({
    children,
    title,
    author,
    subject,
    language,
    producer,
  }: Record<string, unknown> & { children: ReactNode }) => (
    <div
      data-testid="documento"
      data-title={title as string}
      data-author={author as string}
      data-subject={subject as string}
      data-language={language as string}
      data-producer={producer as string}
    >
      {children}
    </div>
  ),
  Page: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  View: ({ children, wrap }: { children: ReactNode; wrap?: boolean }) => (
    <div data-wrap={wrap === false ? 'no' : undefined}>{children}</div>
  ),
  Text: ({
    children,
    render,
  }: {
    children?: ReactNode;
    render?: (datos: { pageNumber: number; totalPages: number }) => string;
  }) => (
    <span>{render ? render({ pageNumber: 1, totalPages: 2 }) : children}</span>
  ),
  Link: ({ children, src }: { children: ReactNode; src: string }) => (
    <a href={src}>{children}</a>
  ),
  Image: ({ src }: { src: string }) => <img src={src} alt="foto" />,
}));

import {
  CurriculumPDF,
  DatosCurriculumPDF,
} from '../../src/pages/components/curriculum/pdf/CurriculumPDF';
import { ConocimientoNivel } from '../../src/interfaces/conocimiento.interface';

const datos: DatosCurriculumPDF = {
  perfil: {
    id: 'p',
    nombre: 'Ana',
    apellidos: 'Pérez',
    email: 'ana@correo.com',
    telefono: '600 11 22 33',
    direccion: 'Madrid',
    descripcion: 'Desarrolladora full stack',
    foto: 'data:image/jpeg;base64,FOTO',
    linkedinURL: 'https://www.linkedin.com/in/ana/',
    githubURL: 'https://github.com/ana',
  },
  conocimiento: [
    { id: 'c1', titulo: 'Angular', nivel: ConocimientoNivel.AVANZADO },
    { id: 'c2', titulo: 'Docker', nivel: ConocimientoNivel.BASICO },
    { id: 'c3', titulo: 'Node', nivel: ConocimientoNivel.INTERMEDIO },
    { id: 'c4', titulo: 'React', nivel: ConocimientoNivel.AVANZADO },
  ],
  experiencia: [
    {
      id: 'e1',
      empresa: 'Everis',
      descripcion: 'Desarrolladora',
      fechaInicio: '2020-03-15T00:00:00',
      fechaFin: '2022-06-15T00:00:00',
      tecnologias: ['c1', 'c2', 'c4'],
      hitos: [
        { id: 'h1', descripcion: 'Migró la app a Angular', experiencia: 'e1' },
        {
          id: 'h2',
          descripcion: 'Redujo el tiempo de carga',
          experiencia: 'e1',
        },
      ],
    },
  ],
  formaciones: [
    {
      id: 'f1',
      titulo: 'Ingeniería Informática',
      institucion: 'UPM',
      fechaFin: '2019-06-15T00:00:00',
    },
  ] as DatosCurriculumPDF['formaciones'],
  formacionesComplementarias: [
    { id: 'fc1', titulo: 'Curso de React' },
  ] as DatosCurriculumPDF['formacionesComplementarias'],
};

const renderPDF = (cambios: Partial<DatosCurriculumPDF> = {}) =>
  render(<CurriculumPDF {...datos} {...cambios} />);

describe('CurriculumPDF', () => {
  test('pinta cabecera, descripción y foto', () => {
    renderPDF();

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Desarrolladora full stack')).toBeInTheDocument();
    expect(screen.getByAltText('foto')).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,FOTO',
    );
  });

  test('sin foto no pinta imagen', () => {
    renderPDF({ perfil: { ...datos.perfil!, foto: undefined } });

    expect(screen.queryByAltText('foto')).not.toBeInTheDocument();
  });

  test('email y teléfono son enlaces mailto: y tel:', () => {
    renderPDF();

    expect(
      screen.getByRole('link', { name: 'ana@correo.com' }),
    ).toHaveAttribute('href', 'mailto:ana@correo.com');
    expect(screen.getByRole('link', { name: '600 11 22 33' })).toHaveAttribute(
      'href',
      'tel:600112233',
    );
  });

  test('LinkedIn y GitHub se escriben sin https:// y son enlaces', () => {
    renderPDF();

    expect(
      screen.getByRole('link', { name: 'www.linkedin.com/in/ana' }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/ana/');
    expect(
      screen.getByRole('link', { name: 'github.com/ana' }),
    ).toHaveAttribute('href', 'https://github.com/ana');
  });

  test('sin linkedinURL ni githubURL no se pintan esos enlaces', () => {
    renderPDF({
      perfil: { ...datos.perfil!, linkedinURL: '', githubURL: undefined },
    });

    expect(screen.queryByText(/linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
  });

  test('una URL larga baja su último tramo a una segunda línea', () => {
    renderPDF({
      perfil: {
        ...datos.perfil!,
        linkedinURL:
          'https://www.linkedin.com/in/antonio-macian-martinez-4b744a86',
      },
    });

    const enlace = screen.getByRole('link', { name: /antonio-macian/ });
    expect(enlace.textContent).toBe(
      'www.linkedin.com/in/\nantonio-macian-martinez-4b744a86',
    );
    expect(enlace).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/antonio-macian-martinez-4b744a86',
    );
  });

  test('competencias clave: Avanzado e Intermedio, nunca Básico', () => {
    renderPDF();

    expect(screen.getByText('Competencias clave')).toBeInTheDocument();
    expect(screen.getByText('Avanzado')).toBeInTheDocument();
    expect(screen.getByText('Intermedio')).toBeInTheDocument();
    // Angular también aparece en las tecnologías, pero dentro de una línea
    expect(screen.getByText('Angular')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node')).toBeInTheDocument();
    expect(screen.queryByText('Docker')).not.toBeInTheDocument();
  });

  test('un nivel vacío no pinta su línea y sin ninguno no hay sección', () => {
    const { unmount } = renderPDF({
      conocimiento: datos.conocimiento.filter(
        (c) => c.nivel !== ConocimientoNivel.INTERMEDIO,
      ),
    });
    expect(screen.queryByText('Intermedio')).not.toBeInTheDocument();
    unmount();

    renderPDF({ conocimiento: [datos.conocimiento[1]] });
    expect(screen.queryByText('Competencias clave')).not.toBeInTheDocument();
  });

  test('experiencia: empresa, cargo, fechas, tecnologías en línea e hitos', () => {
    renderPDF();

    expect(screen.getByText('Everis')).toBeInTheDocument();
    expect(screen.getByText('Desarrolladora')).toBeInTheDocument();
    expect(screen.getByText('03/2020 - 06/2022')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) => el?.textContent === 'Tecnologías: Angular, Docker, React',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Migró la app a Angular')).toBeInTheDocument();
    expect(screen.getByText('Redujo el tiempo de carga')).toBeInTheDocument();
  });

  test('sin tecnologías no pinta la línea Tecnologías', () => {
    renderPDF({ experiencia: [{ ...datos.experiencia[0], tecnologias: [] }] });

    expect(screen.queryByText(/Tecnologías/)).not.toBeInTheDocument();
  });

  test('cada hito, cada competencia y la cabecera del puesto no se parten', () => {
    const { container } = renderPDF();

    const sinPartir = container.querySelectorAll('[data-wrap="no"]');
    // cabecera del puesto + 2 hitos + 3 competencias (Angular, React, Node)
    expect(sinPartir).toHaveLength(6);
  });

  test('formaciones: título e (institución - fecha), omitido si no hay datos', () => {
    renderPDF();

    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) => el?.textContent === 'Ingeniería Informática (UPM - 06/2019)',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Curso de React')).toBeInTheDocument();
    expect(screen.queryByText(/\(\)/)).not.toBeInTheDocument();
  });

  test('las secciones vacías no se pintan', () => {
    renderPDF({
      experiencia: [],
      formaciones: [],
      formacionesComplementarias: [],
    });

    expect(screen.queryByText('Experiencia')).not.toBeInTheDocument();
    expect(screen.queryByText('Formación Académica')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Formación Complementaria'),
    ).not.toBeInTheDocument();
  });

  test('pie con nombre y número de página', () => {
    renderPDF();

    expect(screen.getByText('Ana Pérez · Página 1 de 2')).toBeInTheDocument();
  });

  test('metadatos del documento', () => {
    renderPDF();

    const documento = screen.getByTestId('documento');
    expect(documento).toHaveAttribute(
      'data-title',
      'Ana Pérez | Curriculum Vitae',
    );
    expect(documento).toHaveAttribute('data-author', 'Ana Pérez');
    expect(documento).toHaveAttribute(
      'data-subject',
      'Desarrolladora full stack',
    );
    expect(documento).toHaveAttribute('data-language', 'es');
    expect(documento).toHaveAttribute('data-producer', 'Curriculum Vitae');
  });

  test('sin perfil no hay cabecera, ni pie, ni autor', () => {
    renderPDF({ perfil: null });

    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    expect(screen.getByText('Everis')).toBeInTheDocument();
    expect(screen.getByTestId('documento')).not.toHaveAttribute('data-author');
    expect(screen.getByTestId('documento')).toHaveAttribute(
      'data-title',
      'Curriculum Vitae',
    );
  });
});
