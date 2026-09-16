import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useMensajeAccion } from '../hooks/useMensajeAccion';
import type { MensajeAccion } from '../interfaces/mensajeAccion.interface';
import type { HookCrud } from './crearCrudStore';

import styles from '../pages/Layout.module.scss';

export interface PropsCardCrud<T> {
  item: T;
  enEdicion: boolean;
  onEditar: (item: T) => void;
  onEliminar: () => void;
}

export interface PropsFormCrud<T, P> {
  enEdicion: T | null;
  onSubmit: (payload: P) => Promise<void>;
  onLimpiar: () => void;
  mensaje: MensajeAccion | null;
}

interface ConfigPaginaCrud<N extends string, T, P> {
  nombre: N;
  titulo: string;
  // Solo cambia la terminación de los mensajes: creado/creada, etc.
  femenino?: boolean;
  useStore: () => HookCrud<N, T, P>;
  renderCard: (props: PropsCardCrud<T>) => ReactNode;
  renderForm: (props: PropsFormCrud<T, P>) => ReactNode;
}

// T, P y N se infieren del hook del store; las render functions adaptan los props de cada Card/Form.
export const crearPaginaCrud = <N extends string, T extends { id: string }, P>({
  nombre,
  titulo,
  femenino = false,
  useStore,
  renderCard,
  renderForm,
}: ConfigPaginaCrud<N, T, P>) => {
  const sufijo = (nombre[0].toUpperCase() + nombre.slice(1)) as Capitalize<N>;
  const terminacion = femenino ? 'a' : 'o';

  const PaginaCrud = () => {
    const store = useStore();
    // TS no resuelve el acceso por claves calculadas sobre HookCrud: los casts reflejan su tipo.
    const lista = store[nombre] as T[] | null;
    const get = store[`get${sufijo}`] as () => Promise<boolean>;
    const create = store[`create${sufijo}`] as (payload: P) => Promise<boolean>;
    const update = store[`update${sufijo}`] as (
      id: string,
      payload: P,
    ) => Promise<boolean>;
    const remove = store[`delete${sufijo}`] as (id: string) => Promise<boolean>;

    const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

    const [enEdicion, setEnEdicion] = useState<T | null>(null);

    const enviar = async (payload: P) => {
      if (enEdicion) {
        const actualizado = await update(enEdicion.id, payload);
        if (!actualizado) return mostrarError();
        return mostrarMensaje(`${titulo} actualizad${terminacion}`);
      }

      const creado = await create(payload);
      if (!creado) return mostrarError();
      mostrarMensaje(`${titulo} cread${terminacion}`);
    };

    const eliminar = async (id: string) => {
      const eliminado = await remove(id);
      if (!eliminado) return mostrarError();
      mostrarMensaje(`${titulo} eliminad${terminacion}`);
    };

    useEffect(() => {
      if (lista === null)
        get().then((obtenido) => {
          if (!obtenido) mostrarError();
        });
    }, []);

    if (store.loading) return <p>Cargando...</p>;

    return (
      <div className={styles.Page}>
        {lista && lista.length > 0 && (
          <div className={styles.data}>
            {lista.map((item) => (
              <Fragment key={item.id}>
                {renderCard({
                  item,
                  enEdicion: item.id === enEdicion?.id,
                  onEditar: setEnEdicion,
                  onEliminar: () => eliminar(item.id),
                })}
              </Fragment>
            ))}
          </div>
        )}
        <div className={styles.form}>
          <h1>{enEdicion ? `Editar ${titulo}` : `Crear ${titulo}`}</h1>
          {/* `key` remonta el form al cambiar la entidad en edición: su estado inicial se deriva de ella. */}
          <Fragment key={enEdicion?.id ?? 'nuevo'}>
            {renderForm({
              enEdicion,
              onSubmit: enviar,
              onLimpiar: () => setEnEdicion(null),
              mensaje,
            })}
          </Fragment>
        </div>
      </div>
    );
  };

  PaginaCrud.displayName = titulo;

  return PaginaCrud;
};
