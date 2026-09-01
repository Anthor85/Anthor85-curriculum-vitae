import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setFormacionComplementaria } from '../store';
import type {
  FormacionComplementaria,
  FormacionComplementariaPayload,
} from '../interfaces/formacionComplementaria.interface';

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

  const createFormacionComplementaria = async (
    payload: FormacionComplementariaPayload,
  ) => {
    try {
      const { data } = await api.post('/formacionComplementaria', payload);

      dispatch(setFormacionComplementaria([...formacionComplementaria, data]));
      return true;
    } catch (error) {
      console.error('Error creating formacionComplementaria:', error);
      return false;
    }
  };

  const updateFormacionComplementaria = async (
    id: string,
    payload: FormacionComplementariaPayload,
  ) => {
    try {
      const { data } = await api.put(`/formacionComplementaria/${id}`, payload);

      dispatch(
        setFormacionComplementaria(
          formacionComplementaria.map((form: FormacionComplementaria) =>
            form.id === data.id ? data : form,
          ),
        ),
      );
      return true;
    } catch (error) {
      console.error('Error updating formacionComplementaria:', error);
      return false;
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
      return true;
    } catch (error) {
      console.error('Error deleting formacionComplementaria:', error);
      return false;
    }
  };

  return {
    formacionComplementaria,
    loading,
    error,

    getFormacionComplementaria,
    createFormacionComplementaria,
    updateFormacionComplementaria,
    deleteFormacionComplementaria,
  };
};
