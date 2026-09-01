import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = (
  exportableHTML: HTMLDivElement,
  nombreFichero: string,
) => {
  html2canvas(exportableHTML, {
    useCORS: true,
    scale: 2,
  }).then((canvas) => {
    const doc = new jsPDF();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let restante = imgHeight;
    let posicion = 0;

    doc.addImage(imgData, 'JPEG', 0, posicion, pdfWidth, imgHeight);

    while ((restante -= pdfHeight) > 0) {
      posicion -= pdfHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, posicion, pdfWidth, imgHeight);
    }

    doc.save(`${nombreFichero}.pdf`);
  });
};
