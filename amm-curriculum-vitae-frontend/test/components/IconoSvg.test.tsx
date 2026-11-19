import { render } from '@testing-library/react';

import { IconoSvg } from '../../src/components/IconoSvg';

const SVG =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>';

describe('<IconoSvg />', () => {
  it('pinta un span aria-hidden con el SVG codificado como mascara', () => {
    const { container } = render(<IconoSvg svg={SVG} />);

    const icono = container.querySelector('span');
    expect(icono).toBeInTheDocument();
    expect(icono).toHaveAttribute('aria-hidden', 'true');
    const style = icono?.getAttribute('style') ?? '';
    expect(style).toContain('data:image/svg+xml,');
    expect(style).toContain(encodeURIComponent(SVG));
  });

  it('no pinta nada con un SVG vacio', () => {
    const { container } = render(<IconoSvg svg="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('no crea ningun nodo script aunque el SVG lo contenga', () => {
    const malicioso =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const { container } = render(<IconoSvg svg={malicioso} />);

    expect(container.querySelector('script')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
  });

  it('anade la clase recibida por props', () => {
    const { container } = render(<IconoSvg svg={SVG} className="extra" />);

    expect(container.querySelector('span')).toHaveClass('extra');
  });
});
