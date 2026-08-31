import { useDispatch, useSelector } from 'react-redux';
import { CurriculumState } from '../interfaces/curriculum.interface';
import api from '../api/api';
import { setCurriculum } from '../store';

export const useCurriculumStore = () => {
  const dispatch = useDispatch();
  const { curriculum, loading, error } = useSelector(
    (state: CurriculumState) => state.curriculum,
  );

  const getCurriculum = async () => {
    try {
      const { data } = await api.get('/curriculum');
      console.log('Curriculum data:', data);

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
