import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setFormacionComplementaria } from '../store';

export const useFormacionComplementariaStore = () => {
  const dispatch = useDispatch();
  const { formacionComplementaria, loading, error } = useSelector(
    (state: any) => state.formacionComplementaria,
  );

  const getFormacionComplementaria = async () => {
    try {
      const { data } = await api.get('/formacionComplementaria');
      console.log('FormacionComplementaria data:', data);

      dispatch(setFormacionComplementaria(data));
    } catch (error) {
      console.error('Error fetching formacionComplementaria:', error);
    }
  };

  const createFormacionComplementaria = async (formData: FormData) => {
    try {
      const { data } = await api.post('/formacionComplementaria', formData);

      dispatch(setFormacionComplementaria([...formacionComplementaria, data]));
    } catch (error) {
      console.error('Error creating formacionComplementaria:', error);
    }
  };

  const deleteFormacionComplementaria = async (id: string) => {
    try {
      const { data } = await api.delete(`/formacionComplementaria/${id}`);
      console.log(
        'formacionComplementaria deleted:',
        formacionComplementaria,
        data,
      );

      dispatch(
        setFormacionComplementaria(
          formacionComplementaria.filter(
            (form: any) => form.id !== data.formacionComplementaria.id,
          ),
        ),
      );
    } catch (error) {
      console.error('Error deleting formacionComplementaria:', error);
    }
  };

  return {
    formacionComplementaria,
    loading,
    error,

    getFormacionComplementaria,
    createFormacionComplementaria,
    deleteFormacionComplementaria,
  };
};
