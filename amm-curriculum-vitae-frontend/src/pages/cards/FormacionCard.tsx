import { Button } from '../../components/Button';
import { dateConverter } from '../../helpers/dateConverter';
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
  const { titulo, institucion, fechaFin, descripcion } = formacion;

  return (
    <div className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
        <div className={styles.subdata}>
          <b>Fecha:</b> {dateConverter(new Date(fechaFin))}
        </div>
        {descripcion && (
          <div className={styles.subdata}>
            <b>A tener en cuenta:</b> {descripcion}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <Button onClick={() => onEditar(formacion)} name="Editar" />
        <Button onClick={() => deleteFormacion(formacion.id)} name="Eliminar" />
      </div>
    </div>
  );
};
