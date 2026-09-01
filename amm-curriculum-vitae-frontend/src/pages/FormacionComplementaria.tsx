import { useEffect, useState } from 'react';
import { useFormacionComplementariaStore, useMensajeAccion } from '../hooks';
import { FormacionComplementariaForm } from './forms/FormacionComplementariaForm';
import { FormacionComplementariaCard } from './cards';
import {
  FormacionComplementaria as IFormacionComplementaria,
  FormacionComplementariaPayload,
} from '../interfaces/formacionComplementaria.interface';

import styles from './Layout.module.scss';

export const FormacionComplementaria = () => {
  const {
    formacionComplementaria,
    loading,
    error,

    getFormacionComplementaria,
    createFormacionComplementaria,
    updateFormacionComplementaria,
    deleteFormacionComplementaria,
  } = useFormacionComplementariaStore();

  const { mensaje, mostrarMensaje } = useMensajeAccion();

  const [
    formacionComplementariaEnEdicion,
    setFormacionComplementariaEnEdicion,
  ] = useState<IFormacionComplementaria | null>(null);

  const enviarFormacionComplementaria = async (
    payload: FormacionComplementariaPayload,
  ) => {
    if (formacionComplementariaEnEdicion) {
      const actualizada = await updateFormacionComplementaria(
        formacionComplementariaEnEdicion.id,
        payload,
      );
      if (actualizada) mostrarMensaje('Formación Complementaria actualizada');
      return;
    }

    const creada = await createFormacionComplementaria(payload);
    if (creada) mostrarMensaje('Formación Complementaria creada');
  };

  const eliminarFormacionComplementaria = async (id: string) => {
    const eliminada = await deleteFormacionComplementaria(id);
    if (eliminada) mostrarMensaje('Formación Complementaria eliminada');
  };

  useEffect(() => {
    if (formacionComplementaria === null) getFormacionComplementaria();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      {formacionComplementaria && formacionComplementaria.length > 0 && (
        <div className={styles.data}>
          {formacionComplementaria.map((f: IFormacionComplementaria) => (
            <FormacionComplementariaCard
              key={f.id}
              formacionComplementaria={f}
              deleteFormacionComplementaria={() =>
                eliminarFormacionComplementaria(f.id)
              }
              onEditar={setFormacionComplementariaEnEdicion}
              enEdicion={f.id === formacionComplementariaEnEdicion?.id}
            />
          ))}
        </div>
      )}
      <div className={styles.form}>
        <h1>
          {formacionComplementariaEnEdicion
            ? 'Editar Formación Complementaria'
            : 'Crear Formación Complementaria'}
        </h1>
        <FormacionComplementariaForm
          formacionComplementariaEnEdicion={formacionComplementariaEnEdicion}
          onSubmitFormacionComplementaria={enviarFormacionComplementaria}
          onLimpiar={() => setFormacionComplementariaEnEdicion(null)}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
