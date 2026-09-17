import { useCallback } from 'react';
import { isAxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import {
  RootState,
  setErrorPerfil,
  setLoadingPerfil,
  setPerfil,
} from '../store';
import type { PerfilPayload } from '../interfaces/perfil.interface';

export const usePerfilStore = () => {
  const dispatch = useDispatch();
  const { perfil, loading, error } = useSelector(
    (state: RootState) => state.perfil,
  );

  const inicializarLlamada = useCallback(() => {
    dispatch(setLoadingPerfil(true));
    dispatch(setErrorPerfil(null));
  }, [dispatch]);

  const getPerfil = useCallback(async () => {
    inicializarLlamada();
    try {
      const { data } = await api.get('/perfil');

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      // Un 404 significa que aún no hay perfil creado, no es un fallo.
      if (isAxiosError(error) && error.response?.status === 404) return true;
      const mensajeError = 'Error recuperando perfil';
      console.error(mensajeError, error);
      dispatch(setErrorPerfil(mensajeError));
      return false;
    } finally {
      dispatch(setLoadingPerfil(false));
    }
  }, [dispatch, inicializarLlamada]);

  const createPerfil = async (payload: PerfilPayload) => {
    inicializarLlamada();
    try {
      const { data } = await api.post('/perfil', payload);

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      const mensajeError = 'Error creando perfil';
      console.error(mensajeError, error);
      dispatch(setErrorPerfil(mensajeError));
      return false;
    } finally {
      dispatch(setLoadingPerfil(false));
    }
  };

  const updatePerfil = async (payload: PerfilPayload) => {
    inicializarLlamada();
    try {
      const { data } = await api.put('/perfil', payload);

      dispatch(setPerfil(data));
      return true;
    } catch (error) {
      const mensajeError = 'Error actualizando perfil';
      console.error(mensajeError, error);
      dispatch(setErrorPerfil(mensajeError));
      return false;
    } finally {
      dispatch(setLoadingPerfil(false));
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
