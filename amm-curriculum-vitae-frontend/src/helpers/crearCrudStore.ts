import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import api from '../api/api';
import { type RootState } from '../store';
import type { EstadoCrud } from './crearSliceCrud';

export type HookCrud<N extends string, T, P> = EstadoCrud<N, T[]> &
  Record<`get${Capitalize<N>}`, () => Promise<boolean>> &
  Record<`create${Capitalize<N>}`, (payload: P) => Promise<boolean>> &
  Record<
    `update${Capitalize<N>}`,
    (id: string, payload: P) => Promise<boolean>
  > &
  Record<`delete${Capitalize<N>}`, (id: string) => Promise<boolean>>;

//Igual que crearSliceCrud: <T, P>() se indican a mano y N se infiere del argumento.
export const crearCrudStore =
  <T extends { id: string }, P>() =>
  <N extends string>(
    nombre: N,
    setAccion: ActionCreatorWithPayload<T[]>,
    setLoading: ActionCreatorWithPayload<boolean>,
    setError: ActionCreatorWithPayload<string | null>,
    selector: (state: RootState) => EstadoCrud<N, T[]>,
  ) => {
    const sufijo = nombre[0].toUpperCase() + nombre.slice(1);
    const endpoint = `/${nombre}`;

    // Nombre "use..." para que la regla de hooks acepte useDispatch/useSelector aquí dentro.
    const useCrudStore = (): HookCrud<N, T, P> => {
      const dispatch = useDispatch();
      const estado = useSelector(selector);
      const lista = estado[nombre] as T[] | null;

      const inicializarLlamada = useCallback(() => {
        dispatch(setLoading(true));
        dispatch(setError(null));
      }, [dispatch]);

      const get = useCallback(async () => {
        inicializarLlamada();
        try {
          const { data } = await api.get<T[]>(endpoint);
          dispatch(setAccion(data));
          return true;
        } catch (error) {
          const errorMessage = `Error obteniendo ${nombre}`;
          dispatch(setError(errorMessage));
          console.error(errorMessage, error);
          return false;
        } finally {
          dispatch(setLoading(false));
        }
      }, [dispatch, inicializarLlamada]);

      const create = async (payload: P) => {
        inicializarLlamada();
        try {
          const { data } = await api.post<T>(endpoint, payload);
          if (lista) dispatch(setAccion([...lista, data]));
          return true;
        } catch (error) {
          const errorMessage = `Error creando ${nombre}`;
          dispatch(setError(errorMessage));
          console.error(errorMessage, error);
          return false;
        } finally {
          dispatch(setLoading(false));
        }
      };

      const update = async (id: string, payload: P) => {
        inicializarLlamada();
        try {
          const { data } = await api.put<T>(`${endpoint}/${id}`, payload);
          if (lista)
            dispatch(
              setAccion(
                lista.map((item) => (item.id === data.id ? data : item)),
              ),
            );
          return true;
        } catch (error) {
          const errorMessage = `Error actualizando ${nombre}`;
          dispatch(setError(errorMessage));
          console.error(errorMessage, error);
          return false;
        } finally {
          dispatch(setLoading(false));
        }
      };

      // Se filtra por el id enviado: el backend no responde igual en todos los delete.
      const remove = async (id: string) => {
        inicializarLlamada();
        try {
          await api.delete(`${endpoint}/${id}`);
          if (lista)
            dispatch(setAccion(lista.filter((item) => item.id !== id)));
          return true;
        } catch (error) {
          const errorMessage = `Error eliminando ${nombre}`;
          dispatch(setError(errorMessage));
          console.error(errorMessage, error);
          return false;
        } finally {
          dispatch(setLoading(false));
        }
      };

      // Claves calculadas en runtime; el tipo lo da HookCrud, el cast es solo de tipos.
      return {
        ...estado,
        [`get${sufijo}`]: get,
        [`create${sufijo}`]: create,
        [`update${sufijo}`]: update,
        [`delete${sufijo}`]: remove,
      } as unknown as HookCrud<N, T, P>;
    };

    return useCrudStore;
  };
