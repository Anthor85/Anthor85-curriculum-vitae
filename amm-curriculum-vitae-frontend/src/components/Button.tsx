import styles from './Button.module.scss';

interface ButtonProps {
  onClick?: () => void;
  name?: string;
  icon?: string;
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
      {icon && <i className={`icon-${icon}`}></i>}
      {name}
    </button>
  );
};
