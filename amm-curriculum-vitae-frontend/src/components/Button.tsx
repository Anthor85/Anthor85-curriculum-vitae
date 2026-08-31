import styles from './Button.module.scss';

interface ButtonProps {
  onClick: () => void;
  name?: string;
  icon?: string;
}

export const Button = ({ onClick, name, icon }: ButtonProps) => {
  return (
    <button onClick={onClick} className={styles.Button}>
      {icon && <i className={`icon-${icon}`}></i>}
      {name}
    </button>
  );
};
