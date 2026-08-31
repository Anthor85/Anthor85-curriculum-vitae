import { useEffect } from 'react';
import { useFormacionComplementariaStore } from '../hooks';
import { FormacionComplementariaForm } from './forms/FormacionComplementariaForm';
import { FormacionComplementariaCard } from './cards';
import { FormacionComplementaria as IFormacionComplementaria } from '../interfaces/formacioncomplementaria.interface';

import styles from './Layout.module.scss';

export const FormacionComplementaria = () => {
  const {
    formacionComplementaria,
    loading,
    error,

    getFormacionComplementaria,
    createFormacionComplementaria,
    deleteFormacionComplementaria,
  } = useFormacionComplementariaStore();

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
                deleteFormacionComplementaria(f.id)
              }
            />
          ))}
        </div>
      )}
      <div className={styles.form}>
        <h1>Crear Formación Complementaria</h1>
        <FormacionComplementariaForm
          onAddFormacionComplementaria={createFormacionComplementaria}
        />
      </div>
    </div>
  );
};
