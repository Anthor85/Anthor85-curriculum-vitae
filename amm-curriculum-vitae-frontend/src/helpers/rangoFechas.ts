import type { TFunction } from 'i18next';

import { dateConverter } from './dateConverter';

// `t` por parámetro (i18n.getFixedT(idioma) o el de useTranslation): el helper
// sigue siendo puro y no depende del singleton de i18n.
export const rangoFechas = (
  t: TFunction,
  fechaInicio: string,
  fechaFin?: string,
): string => {
  return `${dateConverter(new Date(fechaInicio))} - ${fechaFin ? dateConverter(new Date(fechaFin)) : t('fechas.actualidad')}`;
};
