import { useEffect, useState } from 'react';
import { useFormacionStore } from '../hooks';
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
    error,

    getFormacion,
    createFormacion,
    updateFormacion,
    deleteFormacion,
  } = useFormacionStore();

  const [formacionEnEdicion, setFormacionEnEdicion] =
    useState<IFormacion | null>(null);

  const enviarFormacion = async (payload: FormacionPayload) => {
    if (formacionEnEdicion) {
      await updateFormacion(formacionEnEdicion.id, payload);
      return;
    }

    await createFormacion(payload);
  };

  useEffect(() => {
    if (formacion === null) getFormacion();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      {formacion && formacion.length > 0 && (
        <div className={styles.data}>
          {formacion.map((f: IFormacion) => (
            <FormacionCard
              key={f.id}
              formacion={f}
              deleteFormacion={() => deleteFormacion(f.id)}
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
        />
      </div>
    </div>
  );
};
