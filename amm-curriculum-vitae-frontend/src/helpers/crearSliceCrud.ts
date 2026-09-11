import {
  createSlice,
  type CaseReducer,
  type PayloadAction,
  type Slice,
} from '@reduxjs/toolkit';

export type EstadoCrud<N extends string, T> = { [K in N]: T | null } & {
  loading: boolean;
  error: string | null;
};

type Reducer<N extends string, T, P> = CaseReducer<
  EstadoCrud<N, T>,
  PayloadAction<P>
>;

export type ReducersCrud<N extends string, T> = Record<
  `set${Capitalize<N>}`,
  Reducer<N, T, T>
> &
  Record<`setLoading${Capitalize<N>}`, Reducer<N, T, boolean>> &
  Record<`setError${Capitalize<N>}`, Reducer<N, T, string | null>>;

export const crearSliceCrud =
  <T>() =>
  <N extends string>(
    nombre: N,
  ): Slice<EstadoCrud<N, T>, ReducersCrud<N, T>, `${N}Slice`> => {
    const initialState: Record<string, unknown> = {
      [nombre]: null,
      loading: false,
      error: null,
    };

    const sufijo = nombre[0].toUpperCase() + nombre.slice(1);

    const slice = createSlice({
      name: `${nombre}Slice`,
      initialState,
      reducers: {
        [`set${sufijo}`]: (state, action: PayloadAction<T[]>) => {
          state[nombre] = action.payload;
          state.loading = false;
          state.error = null;
        },
        [`setLoading${sufijo}`]: (state, action: PayloadAction<boolean>) => {
          state.loading = action.payload;
        },
        [`setError${sufijo}`]: (
          state,
          action: PayloadAction<string | null>,
        ) => {
          state.error = action.payload;
        },
      },
    });

    // Los tipos se construyen con template literals; el cast es solo de tipos.
    return slice as unknown as Slice<
      EstadoCrud<N, T>,
      ReducersCrud<N, T>,
      `${N}Slice`
    >;
  };
