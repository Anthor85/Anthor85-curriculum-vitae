import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import {
  RootState,
  setCurriculum,
  setErrorCurriculum,
  setLoadingCurriculum,
} from '../store';

export const useCurriculumStore = () => {
  const dispatch = useDispatch();
  const { curriculum, loading, error } = useSelector(
    (state: RootState) => state.curriculum,
  );

  const getCurriculum = useCallback(async () => {
    dispatch(setLoadingCurriculum(true));
    try {
      const { data } = await api.get('/curriculum');

      dispatch(setCurriculum(data));
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      dispatch(setErrorCurriculum('Error al cargar el curriculum'));
      dispatch(setLoadingCurriculum(false));
    }
  }, [dispatch]);

  return {
    curriculum,
    loading,
    error,

    getCurriculum,
  };
};
