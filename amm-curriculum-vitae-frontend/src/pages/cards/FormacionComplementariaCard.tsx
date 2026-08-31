import { FormacionComplementaria } from '../../interfaces/formacioncomplementaria.interface';

import styles from './Cards.module.scss';

interface Props {
  formacionComplementaria: FormacionComplementaria;
  deleteFormacionComplementaria: (id: string) => void;
}
export const FormacionComplementariaCard = ({
  formacionComplementaria,
  deleteFormacionComplementaria,
}: Props) => {
  const { id, titulo, institucion } = formacionComplementaria;

  return (
    <div className={styles.Card} key={id}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={() => deleteFormacionComplementaria(id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
};
