import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import type { Idioma } from '../interfaces/idioma.interface';
import {
  RootState,
  setCurriculum,
  setErrorCurriculum,
  setLoadingCurriculum,
} from '../store';

export const useCurriculumStore = (idioma: Idioma) => {
  const dispatch = useDispatch();
  const { curriculums, loading, error } = useSelector(
    (state: RootState) => state.curriculum,
  );

  const getCurriculum = useCallback(async () => {
    dispatch(setLoadingCurriculum(true));
    try {
      const { data } = await api.get('/curriculum', {
        params: { lang: idioma },
      });

      dispatch(setCurriculum({ idioma, curriculum: data }));
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      dispatch(setErrorCurriculum('Error al cargar el curriculum'));
      dispatch(setLoadingCurriculum(false));
    }
  }, [dispatch, idioma]);

  return {
    curriculum: curriculums[idioma],
    loading,
    error,

    getCurriculum,
  };
};
