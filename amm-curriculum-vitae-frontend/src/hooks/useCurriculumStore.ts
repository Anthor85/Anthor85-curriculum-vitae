import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { RootState, setCurriculum } from '../store';

export const useCurriculumStore = () => {
  const dispatch = useDispatch();
  const { curriculum, loading, error } = useSelector(
    (state: RootState) => state.curriculum,
  );

  const getCurriculum = async () => {
    try {
      const { data } = await api.get('/curriculum');

      dispatch(setCurriculum(data));
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    }
  };

  return {
    curriculum,
    loading,
    error,

    getCurriculum,
  };
};
