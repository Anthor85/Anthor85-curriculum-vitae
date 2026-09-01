import { Conocimiento } from '../interfaces/conocimiento.interface';
import { Curriculum } from '../interfaces/curriculum.interface';
import { Experiencia } from '../interfaces/experiencia.interface';
import { Formacion } from '../interfaces/formacion.interface';
import { FormacionComplementaria } from '../interfaces/formacionComplementaria.interface';

const tiempo = (fecha?: string) => (fecha ? new Date(fecha).getTime() || 0 : 0);

interface CurriculumOrdenado {
  conocimientos: Conocimiento[];
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
    conocimientos: conocimiento || [],
    experienciaOrdenada: [...(experiencia || [])].sort(
      (a, b) => tiempo(b.fechaInicio) - tiempo(a.fechaInicio),
    ),
    formacionesOrdenadas: [...(formaciones || [])].sort(
      (a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin),
    ),
    complementariasOrdenadas: [...(formacionesComplementarias || [])].sort(
      (a, b) => tiempo(b.fechaFin) - tiempo(a.fechaFin),
    ),
  };
};
