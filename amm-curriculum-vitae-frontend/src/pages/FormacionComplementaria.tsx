import { useEffect, useState } from 'react';
import {
  MENSAJE_ERROR,
  useFormacionComplementariaStore,
  useMensajeAccion,
} from '../hooks';
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

    getFormacionComplementaria,
    createFormacionComplementaria,
    updateFormacionComplementaria,
    deleteFormacionComplementaria,
  } = useFormacionComplementariaStore();

  const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

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
      mostrarMensaje(
        actualizada ? 'Formación Complementaria actualizada' : MENSAJE_ERROR,
      );
      return;
    }

    const creada = await createFormacionComplementaria(payload);
    mostrarMensaje(creada ? 'Formación Complementaria creada' : MENSAJE_ERROR);
  };

  const eliminarFormacionComplementaria = async (id: string) => {
    const eliminada = await deleteFormacionComplementaria(id);
    mostrarMensaje(
      eliminada ? 'Formación Complementaria eliminada' : MENSAJE_ERROR,
    );
  };

  useEffect(() => {
    if (formacionComplementaria === null)
      getFormacionComplementaria().then((obtenida) => {
        if (!obtenida) mostrarError();
      });
  }, []);

  if (loading) return <p>Cargando...</p>;

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
