import { Conocimiento } from "../interfaces/conocimiento.interface";

export const tecnologiasFilter = (tecnologias: string[], conocimientos: Conocimiento[]) => {
  return conocimientos.filter((tech: Conocimiento) => tecnologias.includes(tech.id));
}