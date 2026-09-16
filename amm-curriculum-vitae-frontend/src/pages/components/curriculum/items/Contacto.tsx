import { getIcons } from '../../../../helpers/getIcons';
import { Perfil } from '../../../../interfaces/perfil.interface';

interface ContactoProps {
  perfil: Perfil | null;
  styles: CSSModuleClasses;
}

export const Contacto = ({ perfil, styles }: ContactoProps) => {
  return (
    <>
      {perfil?.foto && (
        <img
          className={styles.photo}
          src={perfil.foto}
          alt={`${perfil.nombre} ${perfil.apellidos}`}
          width={150}
        />
      )}
      {perfil && (
        <div className={styles.contacto}>
          <div className={styles.contacto__linea}>
            <img src={getIcons('chincheta')} alt="" />
            <span>{perfil.direccion}</span>
          </div>
          <div className={styles.contacto__linea}>
            <img src={getIcons('telefono')} alt="" />
            <span>{perfil.telefono}</span>
          </div>
          <div className={styles.contacto__linea}>
            <img src={getIcons('sobre')} alt="" />
            <span>{perfil.email}</span>
          </div>
        </div>
      )}
    </>
  );
};
