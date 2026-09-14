import { act } from '@testing-library/react';

import { renderHookConStore } from '../utils';
import {
  ConocimientoNivel,
  type Conocimiento,
} from '../../src/interfaces/conocimiento.interface';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../src/api/api', () => ({
  default: apiMock,
  api: apiMock,
}));

import { useConocimientoStore } from '../../src/hooks/useConocimientoStore';

const conocimiento = (id: string, titulo: string): Conocimiento => ({
  id,
  titulo,
  nivel: ConocimientoNivel.BASICO,
});

const REACT = conocimiento('1', 'React');
const NODE = conocimiento('2', 'Node');

const conListado = (conocimientos: Conocimiento[] | null) => ({
  conocimiento: { conocimiento: conocimientos, loading: false, error: null },
});

const renderCrud = (conocimientos: Conocimiento[] | null = null) =>
  renderHookConStore(useConocimientoStore, conListado(conocimientos));

const listaEnStore = (store: { getState: () => unknown }) =>
  (
    store.getState() as {
      conocimiento: { conocimiento: Conocimiento[] | null };
    }
  ).conocimiento.conocimiento;

const FALLO = new Error('boom');

describe('crearCrudStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('expone el estado y las cuatro acciones con el sufijo del recurso', () => {
    const { result } = renderCrud([REACT]);

    expect(result.current.conocimiento).toEqual([REACT]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.getConocimiento).toBe('function');
    expect(typeof result.current.createConocimiento).toBe('function');
    expect(typeof result.current.updateConocimiento).toBe('function');
    expect(typeof result.current.deleteConocimiento).toBe('function');
  });

  test('get pide al endpoint del recurso y guarda la respuesta', async () => {
    apiMock.get.mockResolvedValue({ data: [REACT, NODE] });
    const { result, store } = renderCrud();

    await act(async () => {
      expect(await result.current.getConocimiento()).toBe(true);
    });

    expect(apiMock.get).toHaveBeenCalledWith('/conocimiento');
    expect(listaEnStore(store)).toEqual([REACT, NODE]);
  });

  test('create anade el elemento devuelto al final de la lista', async () => {
    apiMock.post.mockResolvedValue({ data: NODE });
    const { result, store } = renderCrud([REACT]);

    await act(async () => {
      expect(
        await result.current.createConocimiento({
          titulo: 'Node',
          nivel: ConocimientoNivel.BASICO,
        }),
      ).toBe(true);
    });

    expect(apiMock.post).toHaveBeenCalledWith('/conocimiento', {
      titulo: 'Node',
      nivel: ConocimientoNivel.BASICO,
    });
    expect(listaEnStore(store)).toEqual([REACT, NODE]);
  });

  test('update reemplaza el elemento con el mismo id y respeta la posicion', async () => {
    const actualizado = { ...REACT, titulo: 'React 19' };
    apiMock.put.mockResolvedValue({ data: actualizado });
    const { result, store } = renderCrud([REACT, NODE]);

    await act(async () => {
      expect(
        await result.current.updateConocimiento('1', {
          titulo: 'React 19',
          nivel: ConocimientoNivel.BASICO,
        }),
      ).toBe(true);
    });

    expect(apiMock.put).toHaveBeenCalledWith('/conocimiento/1', {
      titulo: 'React 19',
      nivel: ConocimientoNivel.BASICO,
    });
    expect(listaEnStore(store)).toEqual([actualizado, NODE]);
  });

  test('delete quita el elemento por el id enviado', async () => {
    apiMock.delete.mockResolvedValue({ data: {} });
    const { result, store } = renderCrud([REACT, NODE]);

    await act(async () => {
      expect(await result.current.deleteConocimiento('1')).toBe(true);
    });

    expect(apiMock.delete).toHaveBeenCalledWith('/conocimiento/1');
    expect(listaEnStore(store)).toEqual([NODE]);
  });

  test('sin lista cargada create, update y delete no tocan el store', async () => {
    apiMock.post.mockResolvedValue({ data: NODE });
    apiMock.put.mockResolvedValue({ data: NODE });
    apiMock.delete.mockResolvedValue({ data: {} });
    const { result, store } = renderCrud(null);

    await act(async () => {
      await result.current.createConocimiento({
        titulo: 'Node',
        nivel: ConocimientoNivel.BASICO,
      });
      await result.current.updateConocimiento('2', {
        titulo: 'Node',
        nivel: ConocimientoNivel.BASICO,
      });
      await result.current.deleteConocimiento('2');
    });

    expect(listaEnStore(store)).toBeNull();
  });

  test('cada operacion devuelve false y deja el store intacto si la api falla', async () => {
    apiMock.get.mockRejectedValue(FALLO);
    apiMock.post.mockRejectedValue(FALLO);
    apiMock.put.mockRejectedValue(FALLO);
    apiMock.delete.mockRejectedValue(FALLO);
    const { result, store } = renderCrud([REACT]);

    await act(async () => {
      expect(await result.current.getConocimiento()).toBe(false);
      expect(
        await result.current.createConocimiento({
          titulo: 'Node',
          nivel: ConocimientoNivel.BASICO,
        }),
      ).toBe(false);
      expect(
        await result.current.updateConocimiento('1', {
          titulo: 'Node',
          nivel: ConocimientoNivel.BASICO,
        }),
      ).toBe(false);
      expect(await result.current.deleteConocimiento('1')).toBe(false);
    });

    expect(listaEnStore(store)).toEqual([REACT]);
    expect(console.error).toHaveBeenCalledTimes(4);
  });
});
