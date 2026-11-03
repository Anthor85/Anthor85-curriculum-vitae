import type { TextoLocalizado } from '../interfaces/idioma.interface';

export const TEXTO_VACIO: TextoLocalizado = { es: '', en: '' };

export const trimLocalizado = ({
  es,
  en,
}: TextoLocalizado): TextoLocalizado => ({
  es: es.trim(),
  en: en.trim(),
});

// Pendiente de traducir: hay texto en español y falta el inglés. Un campo
// opcional vacío en los dos idiomas no cuenta.
export const faltaEn = ({ es, en }: TextoLocalizado): boolean =>
  es.trim() !== '' && en.trim() === '';
