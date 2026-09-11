import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import type {
  Conocimiento,
  ConocimientoPayload,
} from '../interfaces/conocimiento.interface';
import { RootState, setConocimiento } from '../store';

export const useConocimientoStore = () => {
  const dispatch = useDispatch();
  const { conocimiento, loading, error } = useSelector(
    (state: RootState) => state.conocimiento,
  );

  const getConocimiento = async () => {
    try {
      const { data } = await api.get('/conocimiento');
      dispatch(setConocimiento(data));
    } catch (error) {
      console.error('Error fetching conocimiento:', error);
    }
  };

  const createConocimiento = async (payload: ConocimientoPayload) => {
    try {
      const { data } = await api.post('/conocimiento', payload);
      conocimiento && dispatch(setConocimiento([...conocimiento, data]));
      return true;
    } catch (error) {
      console.error('Error creating conocimiento:', error);
      return false;
    }
  };

  const updateConocimiento = async (
    id: string,
    payload: ConocimientoPayload,
  ) => {
    try {
      const { data } = await api.put(`/conocimiento/${id}`, payload);
      conocimiento &&
        dispatch(
          setConocimiento(
            conocimiento.map((con: Conocimiento) =>
              con.id === data.id ? data : con,
            ),
          ),
        );
      return true;
    } catch (error) {
      console.error('Error updating conocimiento:', error);
      return false;
    }
  };

  const deleteConocimiento = async (id: string) => {
    try {
      const { data } = await api.delete(`/conocimiento/${id}`);
      conocimiento &&
        dispatch(
          setConocimiento(
            conocimiento.filter((con: any) => con.id !== data.id),
          ),
        );
      return true;
    } catch (error) {
      console.error('Error deleting conocimiento:', error);
      return false;
    }
  };

  return {
    conocimiento,
    loading,
    error,

    getConocimiento,
    createConocimiento,
    updateConocimiento,
    deleteConocimiento,
  };
};
