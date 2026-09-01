import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setPerfil } from '../store';
import type { PerfilPayload } from '../interfaces/perfil.interface';

export const usePerfilStore = () => {
  const dispatch = useDispatch();
  const { perfil, loading, error } = useSelector((state: any) => state.perfil);

  const getPerfil = async () => {
    try {
      const { data } = await api.get('/perfil');
      console.log('Perfil data:', data);

      dispatch(setPerfil(data));
    } catch (error) {
      if ((error as any)?.response?.status === 404) return;

      console.error('Error recuperando perfil:', error);
    }
  };

  const createPerfil = async (payload: PerfilPayload) => {
    try {
      const { data } = await api.post('/perfil', payload);

      dispatch(setPerfil(data));
    } catch (error) {
      console.error('Error creando perfil:', error);
    }
  };

  const updatePerfil = async (payload: PerfilPayload) => {
    try {
      const { data } = await api.put('/perfil', payload);

      dispatch(setPerfil(data));
    } catch (error) {
      console.error('Error actualizando perfil:', error);
    }
  };

  const guardarPerfil = async (payload: PerfilPayload) => {
    return perfil?.id ? updatePerfil(payload) : createPerfil(payload);
  };

  return {
    perfil,
    loading,
    error,

    getPerfil,
    createPerfil,
    updatePerfil,
    guardarPerfil,
  };
};
