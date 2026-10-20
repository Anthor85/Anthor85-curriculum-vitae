import {
  Conocimiento,
  ConocimientoNivel,
} from '../interfaces/conocimiento.interface';

const titulosDeNivel = (
  conocimiento: Conocimiento[],
  nivel: ConocimientoNivel,
) => conocimiento.filter((c) => c.nivel === nivel).map((c) => c.titulo);

// Solo Avanzado e Intermedio, en el orden recibido: los Básicos diluyen el PDF
export const competenciasClave = (conocimiento: Conocimiento[]) => ({
  avanzado: titulosDeNivel(conocimiento, ConocimientoNivel.AVANZADO),
  intermedio: titulosDeNivel(conocimiento, ConocimientoNivel.INTERMEDIO),
});
