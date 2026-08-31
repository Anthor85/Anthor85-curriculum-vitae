import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setConocimiento } from '../store/conocimiento/conocimientoSlice';

export const useConocimientoStore = () => {
  const dispatch = useDispatch();
  const { conocimiento, loading, error } = useSelector(
    (state: any) => state.conocimiento,
  );

  const getConocimiento = async () => {
    try {
      const { data } = await api.get('/conocimiento');
      console.log('Conocimiento data:', data);
      dispatch(setConocimiento(data));
    } catch (error) {
      console.error('Error fetching conocimiento:', error);
    }
  };

  const createConocimiento = async (formData: FormData) => {
    try {
      const { data } = await api.post('/conocimiento', formData);
      dispatch(setConocimiento([...conocimiento, data]));
    } catch (error) {
      console.error('Error creating conocimiento:', error);
    }
  };

  const deleteConocimiento = async (id: string) => {
    try {
      const { data } = await api.delete(`/conocimiento/${id}`);
      console.log('Conocimiento deleted:', data);
      dispatch(
        setConocimiento(conocimiento.filter((con: any) => con.id !== data.id)),
      );
    } catch (error) {
      console.error('Error deleting conocimiento:', error);
    }
  };

  return {
    conocimiento,
    loading,
    error,

    getConocimiento,
    createConocimiento,
    deleteConocimiento,
  };
};
