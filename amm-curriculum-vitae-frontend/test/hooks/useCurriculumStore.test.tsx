import { act } from '@testing-library/react';

import { errorAxios, renderHookConStore } from '../utils';
import type { Curriculum } from '../../src/interfaces/curriculum.interface';
import type { EstadoCrud } from '../../src/helpers/crearSliceCrud';

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

import { useCurriculumStore } from '../../src/hooks/useCurriculumStore';

const CURRICULUM: Curriculum = {
  conocimiento: [],
  experiencia: [],
  formaciones: [],
  formacionesComplementarias: [],
  perfil: null,
};

const estado = (store: { getState: () => unknown }) =>
  (store.getState() as { curriculum: EstadoCrud<'curriculum', Curriculum> })
    .curriculum;

describe('useCurriculumStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('arranca sin curriculum, sin carga y sin error', () => {
    const { result } = renderHookConStore(useCurriculumStore);

    expect(result.current.curriculum).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('getCurriculum pide /curriculum y lo guarda en el store', async () => {
    apiMock.get.mockResolvedValue({ data: CURRICULUM });
    const { result, store } = renderHookConStore(useCurriculumStore);

    await act(async () => {
      await result.current.getCurriculum();
    });

    expect(apiMock.get).toHaveBeenCalledWith('/curriculum');
    expect(estado(store).curriculum).toEqual(CURRICULUM);
    expect(estado(store).loading).toBe(false);
    expect(estado(store).error).toBeNull();
    expect(result.current.curriculum).toEqual(CURRICULUM);
  });

  test('expone el estado precargado sin volver a pedirlo', () => {
    const { result } = renderHookConStore(useCurriculumStore, {
      curriculum: { curriculum: CURRICULUM, loading: true, error: 'vaya' },
    });

    expect(result.current.curriculum).toEqual(CURRICULUM);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe('vaya');
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  test('si la peticion falla el curriculum se queda a null y no rompe', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    apiMock.get.mockRejectedValue(errorAxios(500, { msg: 'Boom' }));
    const { result, store } = renderHookConStore(useCurriculumStore);

    await act(async () => {
      await expect(result.current.getCurriculum()).resolves.toBeUndefined();
    });

    expect(estado(store).curriculum).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching curriculum:',
      expect.anything(),
    );

    consoleError.mockRestore();
  });
});
