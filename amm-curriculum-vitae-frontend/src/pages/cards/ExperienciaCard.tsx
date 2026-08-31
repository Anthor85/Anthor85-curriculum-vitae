import { useConocimientoStore } from '../../hooks';
import { Experiencia } from '../../interfaces/experiencia.interface';

import styles from './Cards.module.scss';

interface Props {
  experiencia: Experiencia;
  deleteExperiencia: (id: string) => void;
  onEditar: (experiencia: Experiencia) => void;
  enEdicion: boolean;
}

export const ExperienciaCard = ({
  experiencia,
  deleteExperiencia,
  onEditar,
  enEdicion,
}: Props) => {
  const { conocimiento } = useConocimientoStore();

  return (
    <div
      className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}
      key={experiencia.id}
    >
      <div className={styles.data}>
        <h2>{experiencia.empresa}</h2>
        <p>{experiencia.descripcion}</p>
        <p>
          {new Date(experiencia.fechaInicio).toLocaleDateString()} -{' '}
          {experiencia.fechaFin
            ? new Date(experiencia.fechaFin).toLocaleDateString()
            : 'En la actualidad'}
        </p>
        {experiencia.tecnologias.length > 0 && (
          <div className={styles.coleccion}>
            <p>Tecnologías:</p>
            <ul className={styles.colecciones}>
              {conocimiento
                .filter((tech: any) =>
                  experiencia.tecnologias.includes(tech.id),
                )
                .map((tech: any) => (
                  <li key={tech.id}>{tech.titulo}</li>
                ))}
            </ul>
          </div>
        )}
        {experiencia.hitos?.length ? (
          <div className={styles.coleccion}>
            <p>Hitos:</p>
            <ul className={styles.colecciones}>
              {experiencia.hitos.map((hito) => (
                <li key={hito.id}>{hito.descripcion}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <button onClick={() => onEditar(experiencia)}>Editar</button>
        <button onClick={() => deleteExperiencia(experiencia.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};
