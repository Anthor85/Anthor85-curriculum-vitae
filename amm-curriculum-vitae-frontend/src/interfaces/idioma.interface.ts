export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export interface TextoLocalizado {
  es: string;
  en: string;
}
