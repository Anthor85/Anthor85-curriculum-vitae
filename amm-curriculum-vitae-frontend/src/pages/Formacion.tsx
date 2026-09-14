import { useEffect, useState } from 'react';
import { MENSAJE_ERROR, useFormacionStore, useMensajeAccion } from '../hooks';
import { FormacionForm } from './forms/FormacionForm';
import { FormacionCard } from './cards';
import {
  Formacion as IFormacion,
  FormacionPayload,
} from '../interfaces/formacion.interface';

import styles from './Layout.module.scss';

export const Formacion = () => {
  const {
    formacion,
    loading,

    getFormacion,
    createFormacion,
    updateFormacion,
    deleteFormacion,
  } = useFormacionStore();

  const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

  const [formacionEnEdicion, setFormacionEnEdicion] =
    useState<IFormacion | null>(null);

  const enviarFormacion = async (payload: FormacionPayload) => {
    if (formacionEnEdicion) {
      const actualizada = await updateFormacion(formacionEnEdicion.id, payload);
      mostrarMensaje(actualizada ? 'Formación actualizada' : MENSAJE_ERROR);
      return;
    }

    const creada = await createFormacion(payload);
    mostrarMensaje(creada ? 'Formación creada' : MENSAJE_ERROR);
  };

  const eliminarFormacion = async (id: string) => {
    const eliminada = await deleteFormacion(id);
    mostrarMensaje(eliminada ? 'Formación eliminada' : MENSAJE_ERROR);
  };

  useEffect(() => {
    if (formacion === null)
      getFormacion().then((obtenida) => {
        if (!obtenida) mostrarError();
      });
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className={styles.Page}>
      {formacion && formacion.length > 0 && (
        <div className={styles.data}>
          {formacion.map((f: IFormacion) => (
            <FormacionCard
              key={f.id}
              formacion={f}
              deleteFormacion={() => eliminarFormacion(f.id)}
              onEditar={setFormacionEnEdicion}
              enEdicion={f.id === formacionEnEdicion?.id}
            />
          ))}
        </div>
      )}
      <div className={styles.form}>
        <h1>{formacionEnEdicion ? 'Editar Formación' : 'Crear Formación'}</h1>
        <FormacionForm
          formacionEnEdicion={formacionEnEdicion}
          onSubmitFormacion={enviarFormacion}
          onLimpiar={() => setFormacionEnEdicion(null)}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
