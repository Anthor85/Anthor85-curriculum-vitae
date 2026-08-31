import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setFormacion } from '../store';

export const useFormacionStore = () => {
  const dispatch = useDispatch();
  const { formacion, loading, error } = useSelector(
    (state: any) => state.formacion,
  );

  const getFormacion = async () => {
    try {
      const { data } = await api.get('/formacion');
      console.log('Formacion data:', data);

      dispatch(setFormacion(data));
    } catch (error) {
      console.error('Error fetching formacion:', error);
    }
  };

  const createFormacion = async (formData: FormData) => {
    try {
      const { data } = await api.post('/formacion', formData);

      dispatch(setFormacion([...formacion, data]));
    } catch (error) {
      console.error('Error creating formacion:', error);
    }
  };

  const deleteFormacion = async (id: string) => {
    try {
      const { data } = await api.delete(`/formacion/${id}`);
      console.log('Formacion deleted:', formacion, data);

      dispatch(
        setFormacion(
          formacion.filter((form: any) => form.id !== data.formacion.id),
        ),
      );
    } catch (error) {
      console.error('Error deleting formacion:', error);
    }
  };

  return {
    formacion,
    loading,
    error,

    getFormacion,
    createFormacion,
    deleteFormacion,
  };
};
