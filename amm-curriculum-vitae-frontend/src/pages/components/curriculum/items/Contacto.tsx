import {
  enlaceEmail,
  enlaceMaps,
  enlaceTelefono,
} from '../../../../helpers/enlacesContacto';
import { getIcons, type IconName } from '../../../../helpers/getIcons';
import { urlFoto } from '../../../../helpers/urlFoto';
import { Perfil } from '../../../../interfaces/perfil.interface';

interface ContactoProps {
  perfil: Perfil | null;
  styles: CSSModuleClasses;
}

interface Linea {
  icono: IconName;
  texto: string;
  href: string;
  externa: boolean;
}

export const Contacto = ({ perfil, styles }: ContactoProps) => {
  const lineas: Linea[] = perfil
    ? [
        {
          icono: 'chincheta',
          texto: perfil.direccion,
          href: enlaceMaps(perfil.direccion),
          externa: true,
        },
        {
          icono: 'telefono',
          texto: perfil.telefono,
          href: enlaceTelefono(perfil.telefono),
          externa: false,
        },
        {
          icono: 'sobre',
          texto: perfil.email,
          href: enlaceEmail(perfil.email),
          externa: false,
        },
        ...(perfil.linkedinURL
          ? [
              {
                icono: 'linkedin' as const,
                texto: 'LinkedIn',
                href: perfil.linkedinURL,
                externa: true,
              },
            ]
          : []),
        ...(perfil.githubURL
          ? [
              {
                icono: 'github' as const,
                texto: 'GitHub',
                href: perfil.githubURL,
                externa: true,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      {perfil?.foto && (
        <img
          className={styles.photo}
          src={urlFoto(perfil.foto)}
          alt={`${perfil.nombre} ${perfil.apellidos}`}
          // Drive responde 429 a las peticiones con Referer de localhost
          referrerPolicy="no-referrer"
          width={150}
        />
      )}
      {perfil && (
        <div className={styles.contacto}>
          {lineas.map(({ icono, texto, href, externa }) => (
            <a
              key={icono}
              className={styles.contacto__linea}
              href={href}
              {...(externa && { target: '_blank', rel: 'noopener noreferrer' })}
            >
              <img src={getIcons(icono)} alt="" />
              <span>{texto}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
};
