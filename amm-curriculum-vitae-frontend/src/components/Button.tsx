import { getIcons, type IconName } from '../helpers/getIcons';
import styles from './Button.module.scss';

interface ButtonProps {
  onClick?: () => void;
  name?: string;
  icon?: IconName;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const Button = ({
  onClick,
  name,
  icon,
  type = 'button',
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={styles.Button}
    >
      {icon && (
        // Máscara en vez de <img> para que el icono herede el color del texto
        <span
          className={styles.icon}
          style={{ maskImage: `url(${getIcons(icon)})` }}
          data-icon={icon}
          aria-hidden="true"
        />
      )}
      {name}
    </button>
  );
};
