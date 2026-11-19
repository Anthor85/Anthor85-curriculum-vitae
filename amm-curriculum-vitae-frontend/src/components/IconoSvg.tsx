import styles from './IconoSvg.module.scss';

interface IconoSvgProps {
  svg: string;
  className?: string;
}

// Máscara CSS: el SVG nunca se inserta en el DOM (sin XSS) y hereda el color del texto
export const IconoSvg = ({ svg, className }: IconoSvgProps) => {
  if (!svg) return null;

  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <span
      className={
        className ? `${styles.IconoSvg} ${className}` : styles.IconoSvg
      }
      style={{ maskImage: url, WebkitMaskImage: url }}
      aria-hidden="true"
    />
  );
};
