const { toBlob, pdf, CurriculumPDF, fotoComoDataURL } = vi.hoisted(() => {
  const toBlob = vi.fn(
    async () => new Blob(['pdf'], { type: 'application/pdf' }),
  );

  return {
    toBlob,
    pdf: vi.fn(() => ({ toBlob })),
    // Devuelve sus props para comprobar con qué datos se genera el PDF
    CurriculumPDF: vi.fn((props: unknown) => ({ props })),
    fotoComoDataURL: vi.fn(),
  };
});

vi.mock('@react-pdf/renderer', () => ({ pdf }));
vi.mock('../../src/pages/components/curriculum/pdf/CurriculumPDF', () => ({
  CurriculumPDF,
}));
vi.mock('../../src/helpers/fotoComoDataURL', () => ({ fotoComoDataURL }));

import { exportToPDF } from '../../src/helpers/exportToPDF';
import type { DatosCurriculumPDF } from '../../src/pages/components/curriculum/pdf/CurriculumPDF';

const datos: DatosCurriculumPDF = {
  perfil: {
    id: 'p',
    nombre: 'Ana',
    apellidos: 'Pérez',
    email: 'ana@correo.com',
    telefono: '600112233',
    direccion: 'Madrid',
    descripcion: 'Resumen',
    foto: 'https://fotos.example.com/foto.jpg',
  },
  experiencia: [],
  formaciones: [],
  formacionesComplementarias: [],
  conocimiento: [],
};

const propsDelPDF = () =>
  (pdf.mock.calls[0] as unknown as [{ props: DatosCurriculumPDF }])[0].props;

describe('exportToPDF', () => {
  let descargas: { href: string; download: string }[];

  beforeEach(() => {
    vi.clearAllMocks();
    descargas = [];

    URL.createObjectURL = vi.fn(() => 'blob:cv');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      descargas.push({ href: this.href, download: this.download });
    });
    fotoComoDataURL.mockResolvedValue('data:image/jpeg;base64,FOTO');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('genera el PDF con pdf().toBlob() y lo descarga con el nombre indicado', async () => {
    await exportToPDF(datos, 'CV Ana Pérez');

    expect(pdf).toHaveBeenCalledTimes(1);
    expect(toBlob).toHaveBeenCalledTimes(1);
    expect(descargas).toEqual([
      { href: 'blob:cv', download: 'CV Ana Pérez.pdf' },
    ]);
  });

  test('sin perfil se descarga igualmente, sin pedir foto', async () => {
    await exportToPDF({ ...datos, perfil: null }, 'CV');

    expect(fotoComoDataURL).not.toHaveBeenCalled();
    expect(propsDelPDF().perfil).toBeNull();
    expect(descargas[0].download).toBe('CV.pdf');
  });

  test('la foto se incrusta como data URL', async () => {
    await exportToPDF(datos, 'CV');

    expect(fotoComoDataURL).toHaveBeenCalledWith(
      'https://fotos.example.com/foto.jpg',
    );
    expect(propsDelPDF().perfil?.foto).toBe('data:image/jpeg;base64,FOTO');
  });

  test('si la foto no se puede descargar el PDF se genera sin foto', async () => {
    fotoComoDataURL.mockResolvedValue(null);

    await exportToPDF(datos, 'CV');

    expect(propsDelPDF().perfil?.foto).toBeUndefined();
    expect(descargas).toHaveLength(1);
  });

  test('el resto de datos pasan tal cual al documento', async () => {
    await exportToPDF(datos, 'CV');

    const { perfil, ...resto } = propsDelPDF();
    const { perfil: original, ...restoOriginal } = datos;

    expect(resto).toEqual(restoOriginal);
    expect(perfil).toEqual({
      ...original,
      foto: 'data:image/jpeg;base64,FOTO',
    });
  });

  test('libera la URL del blob tras descargar y no deja el enlace en el DOM', async () => {
    await exportToPDF(datos, 'CV');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cv');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
