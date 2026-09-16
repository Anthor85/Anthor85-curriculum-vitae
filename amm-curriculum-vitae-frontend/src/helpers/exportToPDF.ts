import { Bloque, calcularCortesPDF } from './calcularCortesPDF';

// Margen superior e inferior de cada página, en mm
const MARGEN_VERTICAL = 12;

// Elementos que no se pueden partir entre páginas
const ATOMICOS = 'h1, h2, h3, h4, p, li, img, span';

// Elementos que deben ir en la misma página que el elemento que les sigue
const CON_SIGUIENTE = 'h1, h2, h3, h4, [data-pdf-con-siguiente]';

const obtenerBloques = (contenedor: HTMLElement): Bloque[] => {
  const origen = contenedor.getBoundingClientRect().top;
  const caja = (el: Element): Bloque => {
    const { top, bottom } = el.getBoundingClientRect();
    return { top: top - origen, bottom: bottom - origen };
  };

  const atomicos = [...contenedor.querySelectorAll(ATOMICOS)].filter(
    (el) => el.getBoundingClientRect().height > 0,
  );
  const bloques = atomicos.map(caja);

  contenedor.querySelectorAll(CON_SIGUIENTE).forEach((el) => {
    const siguiente = atomicos.find(
      (otro) =>
        !el.contains(otro) &&
        el.compareDocumentPosition(otro) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    if (!siguiente) return;

    const propia = caja(el);
    bloques.push({
      top: propia.top,
      bottom: Math.max(propia.bottom, caja(siguiente).bottom),
    });
  });

  return bloques;
};

// html2canvas pinta las imagenes tal cual estan: hay que esperar a que carguen
const esperarImagenes = (contenedor: HTMLElement) =>
  Promise.all(
    [...contenedor.querySelectorAll('img')].map((img) =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {}),
    ),
  );

// html2canvas y jspdf solo se cargan al exportar, no en el bundle inicial
export const exportToPDF = async (
  exportableHTML: HTMLDivElement,
  nombreFichero: string,
) => {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  await esperarImagenes(exportableHTML);

  const bloques = obtenerBloques(exportableHTML);
  const altoHTML = exportableHTML.getBoundingClientRect().height;

  const canvas = await html2canvas(exportableHTML, {
    useCORS: true,
    scale: 2,
  });

  const doc = new jsPDF();
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const altoUtil = pdfHeight - 2 * MARGEN_VERTICAL;
  const mmPorPx = imgHeight / altoHTML;

  const cortes = calcularCortesPDF(bloques, altoHTML, altoUtil / mmPorPx);

  cortes.slice(0, -1).forEach((corte, pagina) => {
    if (pagina > 0) doc.addPage();

    const inicio = corte * mmPorPx;
    const alto = (cortes[pagina + 1] - corte) * mmPorPx;
    doc.addImage(
      imgData,
      'JPEG',
      0,
      MARGEN_VERTICAL - inicio,
      pdfWidth,
      imgHeight,
    );

    // Tapa lo que asoma fuera del tramo de esta página para dejar los márgenes limpios
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pdfWidth, MARGEN_VERTICAL, 'F');
    doc.rect(
      0,
      MARGEN_VERTICAL + alto,
      pdfWidth,
      pdfHeight - MARGEN_VERTICAL - alto,
      'F',
    );
  });

  doc.save(`${nombreFichero}.pdf`);
};
