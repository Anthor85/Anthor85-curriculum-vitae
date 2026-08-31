import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = (exportableHTML: HTMLDivElement) => {
  html2canvas(exportableHTML, {
    useCORS: true,
    allowTaint: true,
    proxy: 'https://cors-anywhere.herokuapp.com/',
    scale: 2, // Increase scale for better quality
    logging: true, // Enable logging for debugging
  }).then((canvas) => {
    const document = new jsPDF();
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = document.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    document.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    console.log('HTML content to export:', imgData);
    document.save('CV Antonio Macián Martínez.pdf');
  });

  // document.html(exportableHTML.innerHTML, {
  //   callback: () => {
  //   },
  // });
};
