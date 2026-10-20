import type { DatosCurriculumPDF } from '../pages/components/curriculum/pdf/CurriculumPDF';
import { fotoComoDataURL } from './fotoComoDataURL';

// react-pdf solo se descarga al exportar, no entra en el bundle inicial.
// La foto va incrustada: si no se puede descargar, el PDF sale sin ella
export const exportToPDF = async (
  datos: DatosCurriculumPDF,
  nombreFichero: string,
) => {
  const [{ pdf }, { CurriculumPDF }, foto] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pages/components/curriculum/pdf/CurriculumPDF'),
    datos.perfil?.foto ? fotoComoDataURL(datos.perfil.foto) : null,
  ]);

  const perfil = datos.perfil && { ...datos.perfil, foto: foto ?? undefined };
  // pdf() pide un elemento Document: el componente no usa hooks, se invoca directo
  const blob = await pdf(CurriculumPDF({ ...datos, perfil })).toBlob();

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreFichero}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};
