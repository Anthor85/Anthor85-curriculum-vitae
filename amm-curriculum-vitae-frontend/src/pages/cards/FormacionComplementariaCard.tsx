import { Button } from '../../components/Button';
import { anioFecha } from '../../helpers/anioFecha';
import { faltaEn } from '../../helpers/textoLocalizado';
import { FormacionComplementaria } from '../../interfaces/formacionComplementaria.interface';

import { MarcaSinEn } from './MarcaSinEn';

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
  const { titulo, institucion, fechaFin } = formacionComplementaria;
  const sinEn = [titulo, institucion].some(faltaEn);

  return (
    <div className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo.es}</div>
        {sinEn && <MarcaSinEn />}
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion.es}
        </div>
        {fechaFin && (
          <div className={styles.subdata}>
            <b>Fecha:</b> {anioFecha(fechaFin)}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <Button
          onClick={() => onEditar(formacionComplementaria)}
          name="Editar"
        />
        <Button
          onClick={() =>
            deleteFormacionComplementaria(formacionComplementaria.id)
          }
          name="Eliminar"
        />
      </div>
    </div>
  );
};
