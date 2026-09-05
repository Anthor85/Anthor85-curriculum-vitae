import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Expandable } from '../../src/components/Expandable';

describe('<Expandable />', () => {
  it('pinta la cabecera y, colapsado por defecto, no pinta el children', () => {
    render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.getByText('Cabecera')).toBeInTheDocument();
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('al pulsar la cabecera pinta el children y aria-expanded pasa a true', async () => {
    const user = userEvent.setup();
    render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    await user.click(screen.getByRole('button', { name: 'Cabecera' }));

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cabecera' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('un segundo click vuelve a colapsar y aria-expanded vuelve a false', async () => {
    const user = userEvent.setup();
    render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    const boton = screen.getByRole('button', { name: 'Cabecera' });
    await user.click(boton);
    await user.click(boton);

    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('con inicialAbierto pinta el children desde el primer render', () => {
    render(
      <Expandable cabecera="Cabecera" inicialAbierto={true}>
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cabecera' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('el triangulo refleja el estado abierto/cerrado con una clase', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    const triangulo = container.querySelector('span');
    expect(triangulo?.className).not.toMatch(/abierto/);

    await user.click(screen.getByRole('button', { name: 'Cabecera' }));

    expect(triangulo?.className).toMatch(/abierto/);
  });
});
