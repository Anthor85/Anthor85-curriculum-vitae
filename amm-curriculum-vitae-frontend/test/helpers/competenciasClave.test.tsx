import { competenciasClave } from '../../src/helpers/competenciasClave';
import {
  Conocimiento,
  ConocimientoNivel,
} from '../../src/interfaces/conocimiento.interface';

const conocimiento = (
  titulo: string,
  nivel: ConocimientoNivel,
): Conocimiento => ({
  id: titulo,
  titulo,
  nivel,
});

describe('competenciasClave', () => {
  test('separa Avanzado e Intermedio y descarta Básico', () => {
    const resultado = competenciasClave([
      conocimiento('Angular', ConocimientoNivel.AVANZADO),
      conocimiento('Docker', ConocimientoNivel.BASICO),
      conocimiento('Node', ConocimientoNivel.INTERMEDIO),
      conocimiento('React', ConocimientoNivel.AVANZADO),
    ]);

    expect(resultado).toEqual({
      avanzado: ['Angular', 'React'],
      intermedio: ['Node'],
    });
  });

  test('conserva el orden recibido', () => {
    const resultado = competenciasClave([
      conocimiento('B', ConocimientoNivel.AVANZADO),
      conocimiento('A', ConocimientoNivel.AVANZADO),
    ]);

    expect(resultado.avanzado).toEqual(['B', 'A']);
  });

  test('un nivel sin conocimientos queda vacío', () => {
    const resultado = competenciasClave([
      conocimiento('Docker', ConocimientoNivel.BASICO),
    ]);

    expect(resultado).toEqual({ avanzado: [], intermedio: [] });
  });

  test('sin conocimientos devuelve ambas listas vacías', () => {
    expect(competenciasClave([])).toEqual({ avanzado: [], intermedio: [] });
  });
});
