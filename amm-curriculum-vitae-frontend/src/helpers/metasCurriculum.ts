import type { Perfil } from '../interfaces/perfil.interface';

const SUFIJO_TITULO = 'Curriculum Vitae';
const MAX_DESCRIPCION = 160;

export interface MetasCurriculum {
  titulo: string;
  descripcion: string;
  url: string;
  imagen: string;
  tarjeta: 'summary' | 'summary_large_image';
  // null: se deja el favicon SVG por defecto
  favicon: string | null;
}

type DatosPerfil = Pick<
  Perfil,
  'nombre' | 'apellidos' | 'descripcion' | 'foto'
>;

export const tituloCurriculum = (
  perfil?: Pick<Perfil, 'nombre' | 'apellidos'> | null,
): string => {
  const nombre = [perfil?.nombre, perfil?.apellidos]
    .filter((parte) => parte?.trim())
    .join(' ');

  return nombre ? `${nombre} | ${SUFIJO_TITULO}` : SUFIJO_TITULO;
};

// siteUrl: URL pública del sitio sin barra final
export const metasCurriculum = (
  perfil: DatosPerfil | null | undefined,
  siteUrl: string,
): MetasCurriculum => {
  const foto = perfil?.foto || null;

  return {
    titulo: tituloCurriculum(perfil),
    descripcion: (perfil?.descripcion ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_DESCRIPCION)
      .trimEnd(),
    url: `${siteUrl}/`,
    imagen: foto ?? `${siteUrl}/og-image.png`,
    tarjeta: foto ? 'summary' : 'summary_large_image',
    favicon: foto,
  };
};
