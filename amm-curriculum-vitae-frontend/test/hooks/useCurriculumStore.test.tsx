import { act } from '@testing-library/react';

import { errorAxios, renderHookConStore } from '../utils';
import type { Curriculum } from '../../src/interfaces/curriculum.interface';
import type { CurriculumState } from '../../src/store/curriculum/curriculumSlice';

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
  (store.getState() as { curriculum: CurriculumState }).curriculum;

const useCurriculumEs = () => useCurriculumStore('es');

describe('useCurriculumStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('arranca sin curriculum, sin carga y sin error', () => {
    const { result } = renderHookConStore(useCurriculumEs);

    expect(result.current.curriculum).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('getCurriculum pide /curriculum y lo guarda en el store', async () => {
    apiMock.get.mockResolvedValue({ data: CURRICULUM });
    const { result, store } = renderHookConStore(useCurriculumEs);

    await act(async () => {
      await result.current.getCurriculum();
    });

    expect(apiMock.get).toHaveBeenCalledWith('/curriculum', {
      params: { lang: 'es' },
    });
    expect(estado(store).curriculums.es).toEqual(CURRICULUM);
    expect(estado(store).loading).toBe(false);
    expect(estado(store).error).toBeNull();
    expect(result.current.curriculum).toEqual(CURRICULUM);
  });

  test('expone el estado precargado sin volver a pedirlo', () => {
    const { result } = renderHookConStore(useCurriculumEs, {
      curriculum: {
        curriculums: { es: CURRICULUM, en: null },
        loading: true,
        error: 'vaya',
      },
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
    const { result, store } = renderHookConStore(useCurriculumEs);

    await act(async () => {
      await expect(result.current.getCurriculum()).resolves.toBeUndefined();
    });

    expect(estado(store).curriculums.es).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching curriculum:',
      expect.anything(),
    );

    consoleError.mockRestore();
  });

  test('guarda cada idioma por separado y conserva el que ya tenía', async () => {
    const CURRICULUM_EN = { ...CURRICULUM, perfil: null, conocimiento: [] };
    apiMock.get.mockResolvedValue({ data: CURRICULUM_EN });
    const { result, store } = renderHookConStore(
      () => useCurriculumStore('en'),
      {
        curriculum: {
          curriculums: { es: CURRICULUM, en: null },
          loading: false,
          error: null,
        },
      },
    );

    expect(result.current.curriculum).toBeNull();

    await act(async () => {
      await result.current.getCurriculum();
    });

    expect(apiMock.get).toHaveBeenCalledWith('/curriculum', {
      params: { lang: 'en' },
    });
    expect(estado(store).curriculums).toEqual({
      es: CURRICULUM,
      en: CURRICULUM_EN,
    });
    expect(result.current.curriculum).toBe(estado(store).curriculums.en);
  });

  test('el idioma ya cargado se expone sin pedirlo otra vez', () => {
    const { result } = renderHookConStore(() => useCurriculumStore('en'), {
      curriculum: {
        curriculums: { es: null, en: CURRICULUM },
        loading: false,
        error: null,
      },
    });

    expect(result.current.curriculum).toEqual(CURRICULUM);
    expect(apiMock.get).not.toHaveBeenCalled();
  });
});
