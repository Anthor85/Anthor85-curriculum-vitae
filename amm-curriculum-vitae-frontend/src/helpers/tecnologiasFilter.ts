import { Conocimiento } from '../interfaces/conocimiento.interface';

export const tecnologiasFilter = (
  tecnologias: string[],
  conocimientos: Conocimiento[],
) => {
  const tecnologiasSet = new Set(tecnologias);

  return conocimientos.filter((tech: Conocimiento) =>
    tecnologiasSet.has(tech.id),
  );
};
