import { tecnologiasFilter } from '../../src/helpers/tecnologiasFilter';
import {
  ConocimientoNivel,
  type Conocimiento,
} from '../../src/interfaces/conocimiento.interface';

const conocimiento = (id: string, titulo: string): Conocimiento => ({
  id,
  titulo,
  nivel: ConocimientoNivel.AVANZADO,
});

const CONOCIMIENTOS = [
  conocimiento('1', 'React'),
  conocimiento('2', 'TypeScript'),
  conocimiento('3', 'Node'),
];

describe('tecnologiasFilter', () => {
  test('devuelve solo los conocimientos cuyo id esta en la lista', () => {
    expect(tecnologiasFilter(['1', '3'], CONOCIMIENTOS)).toEqual([
      CONOCIMIENTOS[0],
      CONOCIMIENTOS[2],
    ]);
  });

  test('mantiene el orden de los conocimientos, no el de las tecnologias', () => {
    expect(
      tecnologiasFilter(['3', '1'], CONOCIMIENTOS).map((c) => c.id),
    ).toEqual(['1', '3']);
  });

  test('sin tecnologias devuelve lista vacia', () => {
    expect(tecnologiasFilter([], CONOCIMIENTOS)).toEqual([]);
  });

  test('ignora los ids que no corresponden a ningun conocimiento', () => {
    expect(tecnologiasFilter(['1', 'fantasma'], CONOCIMIENTOS)).toEqual([
      CONOCIMIENTOS[0],
    ]);
  });

  test('no muta la lista de conocimientos', () => {
    const copia = [...CONOCIMIENTOS];

    tecnologiasFilter(['2'], CONOCIMIENTOS);

    expect(CONOCIMIENTOS).toEqual(copia);
  });
});
