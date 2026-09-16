import { ordenarCurriculum } from '../../src/helpers/ordenarCurriculum';
import type { Curriculum } from '../../src/interfaces/curriculum.interface';
import {
  ConocimientoNivel,
  type Conocimiento,
} from '../../src/interfaces/conocimiento.interface';
import type { Experiencia } from '../../src/interfaces/experiencia.interface';
import type { Formacion } from '../../src/interfaces/formacion.interface';
import type { FormacionComplementaria } from '../../src/interfaces/formacionComplementaria.interface';

const conocimiento = (id: string, titulo: string): Conocimiento => ({
  id,
  titulo,
  nivel: ConocimientoNivel.BASICO,
});

const experiencia = (id: string, fechaInicio?: string): Experiencia =>
  ({
    id,
    empresa: `Empresa ${id}`,
    descripcion: '',
    fechaInicio,
    tecnologias: [],
    hitos: [],
  }) as unknown as Experiencia;

const formacion = (id: string, fechaFin?: string): Formacion =>
  ({
    id,
    titulo: `Titulo ${id}`,
    centro: '',
    fechaInicio: '2000-01-01T00:00:00.000Z',
    fechaFin,
  }) as unknown as Formacion;

const complementaria = (
  id: string,
  fechaFin?: string,
): FormacionComplementaria =>
  ({
    id,
    titulo: `Curso ${id}`,
    centro: '',
    fechaInicio: '2000-01-01T00:00:00.000Z',
    fechaFin,
  }) as unknown as FormacionComplementaria;

const ids = (lista: { id: string }[]) => lista.map((item) => item.id);

describe('ordenarCurriculum', () => {
  test('sin curriculum devuelve las cuatro listas vacias', () => {
    expect(ordenarCurriculum(null)).toEqual({
      experienciaOrdenada: [],
      formacionesOrdenadas: [],
      complementariasOrdenadas: [],
      conocimientosOrdenados: [],
    });
  });

  test('la experiencia se ordena por fechaInicio descendente', () => {
    const curriculum = {
      experiencia: [
        experiencia('a', '2019-01-01T00:00:00.000Z'),
        experiencia('b', '2023-06-01T00:00:00.000Z'),
        experiencia('c', '2021-03-01T00:00:00.000Z'),
      ],
    } as unknown as Curriculum;

    expect(ids(ordenarCurriculum(curriculum).experienciaOrdenada)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  test('formaciones y complementarias se ordenan por fechaFin descendente', () => {
    const curriculum = {
      formaciones: [
        formacion('a', '2015-06-01T00:00:00.000Z'),
        formacion('b', '2020-06-01T00:00:00.000Z'),
      ],
      formacionesComplementarias: [
        complementaria('x', '2022-01-01T00:00:00.000Z'),
        complementaria('y', '2024-01-01T00:00:00.000Z'),
      ],
    } as unknown as Curriculum;

    const { formacionesOrdenadas, complementariasOrdenadas } =
      ordenarCurriculum(curriculum);

    expect(ids(formacionesOrdenadas)).toEqual(['b', 'a']);
    expect(ids(complementariasOrdenadas)).toEqual(['y', 'x']);
  });

  test('los conocimientos se ordenan por titulo con localeCompare', () => {
    const curriculum = {
      conocimiento: [
        conocimiento('1', 'Zustand'),
        conocimiento('2', 'ángular'),
        conocimiento('3', 'React'),
      ],
    } as unknown as Curriculum;

    expect(
      ordenarCurriculum(curriculum).conocimientosOrdenados.map((c) => c.titulo),
    ).toEqual(['ángular', 'React', 'Zustand']);
  });

  test('las fechas ausentes o invalidas cuentan como 0 y van al final', () => {
    const curriculum = {
      experiencia: [
        experiencia('sinFecha'),
        experiencia('invalida', 'no-es-una-fecha'),
        experiencia('valida', '2020-01-01T00:00:00.000Z'),
      ],
    } as unknown as Curriculum;

    expect(ids(ordenarCurriculum(curriculum).experienciaOrdenada)[0]).toBe(
      'valida',
    );
  });

  test('no muta los arrays recibidos', () => {
    const experiencias = [
      experiencia('a', '2019-01-01T00:00:00.000Z'),
      experiencia('b', '2023-01-01T00:00:00.000Z'),
    ];
    const curriculum = { experiencia: experiencias } as unknown as Curriculum;

    const { experienciaOrdenada } = ordenarCurriculum(curriculum);

    expect(ids(experiencias)).toEqual(['a', 'b']);
    expect(experienciaOrdenada).not.toBe(experiencias);
  });
});
