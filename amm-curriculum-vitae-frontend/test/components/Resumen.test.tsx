import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Resumen } from '../../src/components/Resumen';

describe('<Resumen />', () => {
  it('pinta el texto sin boton si es corto', () => {
    render(<Resumen texto="Desarrollador front-end" />);

    expect(screen.getByText('Desarrollador front-end')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('si es largo, el boton alterna Ver mas / Ver menos con aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Resumen texto={'a '.repeat(150)} />);

    const boton = screen.getByRole('button', { name: 'Ver más' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    await user.click(boton);

    expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
