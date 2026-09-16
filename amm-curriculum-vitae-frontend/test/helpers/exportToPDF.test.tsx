const { html2canvasMock, jsPDFMock, doc, canvas } = vi.hoisted(() => {
  const doc = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addPage: vi.fn(),
    addImage: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
  };

  const canvas = {
    width: 800,
    height: 0,
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,FAKE'),
  };

  return {
    doc,
    canvas,
    html2canvasMock: vi.fn(async () => canvas),
    jsPDFMock: vi.fn(function () {
      return doc;
    }),
  };
});

vi.mock('html2canvas', () => ({ default: html2canvasMock }));
vi.mock('jspdf', () => ({ default: jsPDFMock }));

import { exportToPDF } from '../../src/helpers/exportToPDF';

// El canvas se genera al doble de tamaño (scale: 2) y el PDF mide 210mm de
// ancho, así que 1px de HTML son siempre 0.525mm y una página útil
// (297 - 2*12) da para 520px de contenido.
const MM_POR_PX = 0.525;
const ALTO_PAGINA_PX = 520;
const MARGEN = 12;

type Caja = { top: number; bottom: number };

const medir = (el: Element, { top, bottom }: Caja) => {
  el.getBoundingClientRect = () =>
    ({ top, bottom, height: bottom - top }) as DOMRect;
};

// Monta un contenedor de `altoHTML` px con los hijos indicados ya medidos,
// porque en jsdom todos los rects valen cero y el helper los descartaría.
const contenedor = (altoHTML: number, hijos: [string, Caja][] = []) => {
  const div = document.createElement('div');
  medir(div, { top: 0, bottom: altoHTML });

  hijos.forEach(([etiqueta, caja]) => {
    const hijo = document.createElement(etiqueta);
    medir(hijo, caja);
    div.appendChild(hijo);
  });

  canvas.height = altoHTML * 2;
  return div;
};

// Cada página se dibuja desplazando la imagen: y = MARGEN - inicioDelTramo.
const cortes = () =>
  doc.addImage.mock.calls.map(
    (llamada) =>
      Math.round(((MARGEN - Number(llamada[3])) / MM_POR_PX) * 100) / 100,
  );

describe('exportToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('un documento que cabe en una página no añade páginas', async () => {
    const div = contenedor(400, [['p', { top: 10, bottom: 300 }]]);

    await exportToPDF(div as HTMLDivElement, 'mi-cv');

    expect(html2canvasMock).toHaveBeenCalledWith(div, {
      useCORS: true,
      scale: 2,
    });
    expect(doc.addPage).not.toHaveBeenCalled();
    expect(doc.addImage).toHaveBeenCalledTimes(1);
    expect(doc.addImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,FAKE',
      'JPEG',
      0,
      MARGEN,
      210,
      400 * MM_POR_PX,
    );
    expect(doc.save).toHaveBeenCalledWith('mi-cv.pdf');
  });

  test('tapa los márgenes con dos bandas blancas en cada página', async () => {
    const div = contenedor(400);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(doc.setFillColor).toHaveBeenCalledWith(255, 255, 255);
    expect(doc.rect).toHaveBeenNthCalledWith(1, 0, 0, 210, MARGEN, 'F');
    expect(doc.rect).toHaveBeenNthCalledWith(
      2,
      0,
      MARGEN + 400 * MM_POR_PX,
      210,
      297 - MARGEN - 400 * MM_POR_PX,
      'F',
    );
  });

  test('un documento largo se reparte en páginas del alto útil', async () => {
    const div = contenedor(1200);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(doc.addPage).toHaveBeenCalledTimes(2);
    expect(cortes()).toEqual([0, ALTO_PAGINA_PX, ALTO_PAGINA_PX * 2]);
  });

  test('adelanta el corte para no partir un párrafo', async () => {
    const div = contenedor(1200, [['p', { top: 500, bottom: 560 }]]);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(cortes()).toEqual([0, 500, 1020]);
  });

  test('un título viaja a la misma página que el bloque siguiente', async () => {
    const div = contenedor(1200, [
      ['h2', { top: 480, bottom: 500 }],
      ['p', { top: 540, bottom: 600 }],
    ]);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(cortes()).toEqual([0, 480, 1000]);
  });

  test('[data-pdf-con-siguiente] agrupa igual que un título', async () => {
    const div = document.createElement('div');
    medir(div, { top: 0, bottom: 1200 });
    canvas.height = 2400;

    const bloque = document.createElement('div');
    bloque.setAttribute('data-pdf-con-siguiente', '');
    medir(bloque, { top: 470, bottom: 490 });

    const parrafo = document.createElement('p');
    medir(parrafo, { top: 540, bottom: 600 });

    div.append(bloque, parrafo);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(cortes()).toEqual([0, 470, 990]);
  });

  test('los elementos sin altura no mueven los cortes', async () => {
    const div = contenedor(1200, [['p', { top: 500, bottom: 500 }]]);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(cortes()).toEqual([0, ALTO_PAGINA_PX, ALTO_PAGINA_PX * 2]);
  });

  test('un bloque más alto que una página se ignora en vez de bloquear', async () => {
    const div = contenedor(1200, [['p', { top: 100, bottom: 800 }]]);

    await exportToPDF(div as HTMLDivElement, 'cv');

    expect(cortes()).toEqual([0, ALTO_PAGINA_PX, ALTO_PAGINA_PX * 2]);
  });
});
