import { useCallback } from 'react';
import { isAxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { RootState, setPerfil } from '../store';
import type { PerfilPayload } from '../interfaces/perfil.interface';

export const usePerfilStore = () => {
  const dispatch = useDispatch();
  const { perfil, loading, error } = useSelector(
    (state: RootState) => state.perfil,
  );

  const getPerfil = useCallback(async () => {
    try {
      const { data } = await api.get('/perfil');

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      // Un 404 significa que aún no hay perfil creado, no es un fallo.
      if (isAxiosError(error) && error.response?.status === 404) return true;

      console.error('Error recuperando perfil:', error);
      return false;
    }
  }, [dispatch]);

  const createPerfil = async (payload: PerfilPayload) => {
    try {
      const { data } = await api.post('/perfil', payload);

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      console.error('Error creando perfil:', error);
      return false;
    }
  };

  const updatePerfil = async (payload: PerfilPayload) => {
    try {
      const { data } = await api.put('/perfil', payload);

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return false;
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
