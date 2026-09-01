import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setFormacion } from '../store';
import type {
  Formacion,
  FormacionPayload,
} from '../interfaces/formacion.interface';

export const useFormacionStore = () => {
  const dispatch = useDispatch();
  const { formacion, loading, error } = useSelector(
    (state: any) => state.formacion,
  );

  const getFormacion = async () => {
    try {
      const { data } = await api.get('/formacion');
      console.log('Formación data:', data);

      dispatch(setFormacion(data));
    } catch (error) {
      console.error('Error obteniendo formación:', error);
    }
  };

  const createFormacion = async (payload: FormacionPayload) => {
    try {
      const { data } = await api.post('/formacion', payload);

      dispatch(setFormacion([...formacion, data]));
      return true;
    } catch (error) {
      console.error('Error creando formación:', error);
      return false;
    }
  };

  const updateFormacion = async (id: string, payload: FormacionPayload) => {
    try {
      const { data } = await api.put(`/formacion/${id}`, payload);
      dispatch(
        setFormacion(
          formacion.map((form: Formacion) =>
            form.id === data.id ? data : form,
          ),
        ),
      );
      return true;
    } catch (error) {
      console.error('Error actualizando formación:', error);
      return false;
    }
  };

  const deleteFormacion = async (id: string) => {
    try {
      const { data } = await api.delete(`/formacion/${id}`);
      console.log('Formación eliminada:', formacion, data);

      dispatch(
        setFormacion(
          formacion.filter((form: any) => form.id !== data.formacion.id),
        ),
      );
      return true;
    } catch (error) {
      console.error('Error eliminando formación:', error);
      return false;
    }
  };

  return {
    formacion,
    loading,
    error,

    getFormacion,
    createFormacion,
    updateFormacion,
    deleteFormacion,
  };
};
