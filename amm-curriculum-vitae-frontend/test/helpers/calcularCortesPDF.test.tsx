import { calcularCortesPDF } from '../../src/helpers/calcularCortesPDF';

describe('calcularCortesPDF', () => {
  it('si todo cabe en una página no hay cortes intermedios', () => {
    expect(calcularCortesPDF([], 80, 100)).toEqual([0, 80]);
  });

  it('sin bloques corta al alto de página', () => {
    expect(calcularCortesPDF([], 250, 100)).toEqual([0, 100, 200, 250]);
  });

  it('no parte un bloque: corta justo encima', () => {
    expect(calcularCortesPDF([{ top: 90, bottom: 110 }], 150, 100)).toEqual([
      0, 90, 150,
    ]);
  });

  it('encadena bloques solapados (título pegado a lo siguiente)', () => {
    const bloques = [
      { top: 80, bottom: 95 },
      { top: 90, bottom: 110 },
    ];

    expect(calcularCortesPDF(bloques, 150, 100)).toEqual([0, 80, 150]);
  });

  it('un corte justo en el borde de un bloque no lo mueve', () => {
    expect(calcularCortesPDF([{ top: 100, bottom: 120 }], 150, 100)).toEqual([
      0, 100, 150,
    ]);
  });

  it('ignora bloques más altos que una página', () => {
    expect(calcularCortesPDF([{ top: 10, bottom: 250 }], 300, 100)).toEqual([
      0, 100, 200, 300,
    ]);
  });
});
