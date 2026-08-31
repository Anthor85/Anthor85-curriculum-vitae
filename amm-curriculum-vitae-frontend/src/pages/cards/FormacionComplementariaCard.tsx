import { dateConverter } from '../../helpers/dateConverter';
import { FormacionComplementaria } from '../../interfaces/formacionComplementaria.interface';

import styles from './Cards.module.scss';

interface Props {
  formacionComplementaria: FormacionComplementaria;
  deleteFormacionComplementaria: (id: string) => void;
  onEditar: (formacionComplementaria: FormacionComplementaria) => void;
  enEdicion: boolean;
}
export const FormacionComplementariaCard = ({
  formacionComplementaria,
  deleteFormacionComplementaria,
  onEditar,
  enEdicion,
}: Props) => {
  const { id, titulo, institucion, fechaFin } = formacionComplementaria;

  return (
    <div
      className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}
      key={id}
    >
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
        {fechaFin && (
          <div className={styles.subdata}>
            <b>Fecha:</b> {dateConverter(new Date(fechaFin))}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <button onClick={() => onEditar(formacionComplementaria)}>
          Editar
        </button>
        <button onClick={() => deleteFormacionComplementaria(id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
};
