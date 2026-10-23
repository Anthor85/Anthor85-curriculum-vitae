import { Button } from '../../components/Button';
import { anioFecha } from '../../helpers/anioFecha';
import { Formacion } from '../../interfaces/formacion.interface';

import styles from './Cards.module.scss';

interface Props {
  formacion: Formacion;
  deleteFormacion: (id: string) => void;
  onEditar: (formacion: Formacion) => void;
  enEdicion: boolean;
}
export const FormacionCard = ({
  formacion,
  deleteFormacion,
  onEditar,
  enEdicion,
}: Props) => {
  const { titulo, institucion, fechaFin, extras } = formacion;

  return (
    <div className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
        <div className={styles.subdata}>
          <b>Fecha:</b> {anioFecha(fechaFin)}
        </div>
        {extras?.length ? (
          <div className={styles.coleccion}>
            <p>Extra:</p>
            <ul className={styles.colecciones}>
              {extras.map((extra) => (
                <li key={extra.id}>{extra.descripcion}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <Button onClick={() => onEditar(formacion)} name="Editar" />
        <Button onClick={() => deleteFormacion(formacion.id)} name="Eliminar" />
      </div>
    </div>
  );
};
