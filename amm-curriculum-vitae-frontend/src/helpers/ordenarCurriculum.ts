import {
  Conocimiento,
  ConocimientoPrioridad,
} from '../interfaces/conocimiento.interface';
import { Curriculum } from '../interfaces/curriculum.interface';
import { Experiencia } from '../interfaces/experiencia.interface';
import { Formacion } from '../interfaces/formacion.interface';
import { FormacionComplementaria } from '../interfaces/formacionComplementaria.interface';

const tiempo = (fecha?: string) => (fecha ? new Date(fecha).getTime() || 0 : 0);

const PRIORIDADES = Object.values(ConocimientoPrioridad);

// Sin prioridad o con un valor desconocido cuenta como Media.
const indicePrioridad = (prioridad?: ConocimientoPrioridad) => {
  const indice = prioridad ? PRIORIDADES.indexOf(prioridad) : -1;
  return indice === -1
    ? PRIORIDADES.indexOf(ConocimientoPrioridad.MEDIA)
    : indice;
};

interface CurriculumOrdenado {
  conocimientosOrdenados: Conocimiento[];
  experienciaOrdenada: Experiencia[];
  formacionesOrdenadas: Formacion[];
  complementariasOrdenadas: FormacionComplementaria[];
}

export const ordenarCurriculum = (
  curriculum: Curriculum | null,
): CurriculumOrdenado => {
  const { conocimiento, experiencia, formaciones, formacionesComplementarias } =
    curriculum || {};

  return {
    experienciaOrdenada: [...(experiencia || [])].sort(
      (a, b) => tiempo(b.fechaInicio) - tiempo(a.fechaInicio),
    ),
    formacionesOrdenadas: [...(formaciones || [])].sort(
      (a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin),
    ),
    complementariasOrdenadas: [...(formacionesComplementarias || [])].sort(
      (a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin),
    ),
    conocimientosOrdenados: [...(conocimiento || [])].sort(
      (a, b) =>
        indicePrioridad(a.prioridad) - indicePrioridad(b.prioridad) ||
        a.titulo.localeCompare(b.titulo),
    ),
  };
};
