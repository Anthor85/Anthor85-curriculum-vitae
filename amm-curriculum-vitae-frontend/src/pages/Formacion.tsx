import { useEffect } from 'react';
import { useFormacionStore } from '../hooks';
import { FormacionForm } from './forms/FormacionForm';
import { FormacionCard } from './cards';
import { Formacion as IFormacion } from '../interfaces/formacion.interface';

import styles from './Layout.module.scss';

export const Formacion = () => {
    const {
        formacion,
        loading,
        error,

        getFormacion,
        createFormacion,
        deleteFormacion,
    } = useFormacionStore();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    useEffect(() => {
        formacion === null && getFormacion();
    }, []);

	return (
        <div className={styles.Page}>
        {formacion && formacion.length > 0 && (
            <div className={styles.data}>
                {formacion.map((f: IFormacion) => (
                <FormacionCard
                    key={f.id}
                    formacion={f}
                    deleteFormacion={() => deleteFormacion(f.id)}
                />))}
            </div>)}
        <div className={styles.form}>
            <h1>Crear Formación</h1>
            <FormacionForm onAddFormacion={createFormacion} />
        </div>
     </div>
     );
};