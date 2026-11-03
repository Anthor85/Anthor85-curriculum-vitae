// Genérico: sirve al admin (`Conocimiento`) y al CV (`Conocimiento<string>`).
export const tecnologiasFilter = <C extends { id: string }>(
  tecnologias: string[],
  conocimientos: C[],
): C[] => {
  const tecnologiasSet = new Set(tecnologias);

  return conocimientos.filter((tech) => tecnologiasSet.has(tech.id));
};
