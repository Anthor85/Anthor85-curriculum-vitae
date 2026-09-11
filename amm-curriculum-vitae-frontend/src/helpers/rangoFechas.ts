import { dateConverter } from './dateConverter';

export const rangoFechas = (fechaInicio: string, fechaFin?: string): string => {
  return `${dateConverter(new Date(fechaInicio))} - ${fechaFin ? dateConverter(new Date(fechaFin)) : 'En la actualidad'}`;
};
