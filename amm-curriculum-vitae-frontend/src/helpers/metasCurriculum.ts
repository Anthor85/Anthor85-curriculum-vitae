import type { Idioma } from '../interfaces/idioma.interface';
import type { Perfil } from '../interfaces/perfil.interface';

const SUFIJO_TITULO = 'Curriculum Vitae';
const MAX_DESCRIPCION = 160;

const LOCALES: Record<Idioma, string> = { es: 'es_ES', en: 'en_GB' };

export interface Alternativo {
  hreflang: Idioma | 'x-default';
  href: string;
}

export interface MetasCurriculum {
  titulo: string;
  descripcion: string;
  url: string;
  locale: string;
  localeAlternativo: string;
  // hreflang cruzados: las dos páginas enlazan a las dos versiones
  alternativos: Alternativo[];
  imagen: string;
  tarjeta: 'summary' | 'summary_large_image';
  // null: se deja el favicon SVG por defecto
  favicon: string | null;
}

type DatosPerfil = Pick<
  Perfil<string>,
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
  idioma: Idioma,
): MetasCurriculum => {
  const foto = perfil?.foto || null;
  const urlEs = `${siteUrl}/`;
  const urlEn = `${siteUrl}/en`;

  return {
    titulo: tituloCurriculum(perfil),
    descripcion: (perfil?.descripcion ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_DESCRIPCION)
      .trimEnd(),
    url: idioma === 'en' ? urlEn : urlEs,
    locale: LOCALES[idioma],
    localeAlternativo: LOCALES[idioma === 'en' ? 'es' : 'en'],
    alternativos: [
      { hreflang: 'es', href: urlEs },
      { hreflang: 'en', href: urlEn },
      { hreflang: 'x-default', href: urlEs },
    ],
    imagen: foto ?? `${siteUrl}/og-image.png`,
    tarjeta: foto ? 'summary' : 'summary_large_image',
    favicon: foto,
  };
};
