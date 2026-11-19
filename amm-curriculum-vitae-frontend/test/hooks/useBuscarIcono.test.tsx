import { act, renderHook } from '@testing-library/react';

import { errorAxios } from '../utils/errores';
import type { ResultadoIcono } from '../../src/interfaces/conocimiento.interface';

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../src/api/api', () => ({ default: apiMock, api: apiMock }));

import { useBuscarIcono } from '../../src/hooks/useBuscarIcono';

const RESULTADOS: ResultadoIcono[] = [
  { nombre: 'React', fuente: 'simple-icons', icono: '<svg>r</svg>' },
  { nombre: 'R', fuente: 'monograma', icono: '<svg>m</svg>' },
];

describe('useBuscarIcono', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('devuelve los resultados de GET /icono?q= y termina sin error', async () => {
    apiMock.get.mockResolvedValue({ data: { resultados: RESULTADOS } });
    const { result } = renderHook(useBuscarIcono);

    let resultados: ResultadoIcono[] = [];
    await act(async () => {
      resultados = await result.current.buscar('React');
    });

    expect(apiMock.get).toHaveBeenCalledWith('/icono', {
      params: { q: 'React' },
    });
    expect(resultados).toEqual(RESULTADOS);
    expect(result.current.buscando).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('marca buscando mientras la petición está en curso', async () => {
    let resolver: (valor: unknown) => void = () => {};
    apiMock.get.mockReturnValue(new Promise((r) => (resolver = r)));
    const { result } = renderHook(useBuscarIcono);

    let promesa: Promise<ResultadoIcono[]> = Promise.resolve([]);
    act(() => {
      promesa = result.current.buscar('React');
    });
    expect(result.current.buscando).toBe(true);

    await act(async () => {
      resolver({ data: { resultados: [] } });
      await promesa;
    });
    expect(result.current.buscando).toBe(false);
  });

  test.each([
    [errorAxios(502), 'Servicio de iconos no disponible'],
    [errorAxios(404), 'No se pudo buscar el icono'],
    [errorAxios(500), 'No se pudo buscar el icono'],
    [new Error('red'), 'No se pudo buscar el icono'],
  ])('si falla deja el mensaje y relanza (%#)', async (fallo, mensaje) => {
    apiMock.get.mockRejectedValue(fallo);
    const { result } = renderHook(useBuscarIcono);

    await act(async () => {
      await expect(result.current.buscar('React')).rejects.toBe(fallo);
    });

    expect(result.current.error).toBe(mensaje);
    expect(result.current.buscando).toBe(false);
  });

  test('una búsqueda nueva limpia el error anterior', async () => {
    apiMock.get.mockRejectedValueOnce(errorAxios(502));
    apiMock.get.mockResolvedValueOnce({ data: { resultados: RESULTADOS } });
    const { result } = renderHook(useBuscarIcono);

    await act(async () => {
      await result.current.buscar('React').catch(() => {});
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.buscar('React');
    });
    expect(result.current.error).toBeNull();
  });
});
