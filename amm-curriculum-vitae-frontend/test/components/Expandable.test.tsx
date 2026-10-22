import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Expandable } from '../../src/components/Expandable';

describe('<Expandable />', () => {
  it('pinta la cabecera y, colapsado por defecto, el children esta en el DOM con hidden', () => {
    const { container } = render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.getByText('Cabecera')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).not.toBeVisible();
    expect(container.querySelector('[hidden]')).toContainElement(
      screen.getByText('Contenido'),
    );
  });

  it('al pulsar la cabecera se ve el children y aria-expanded pasa a true', async () => {
    const user = userEvent.setup();
    render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    await user.click(screen.getByRole('button', { name: 'Cabecera' }));

    expect(screen.getByText('Contenido')).toBeVisible();
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

    expect(screen.getByText('Contenido')).not.toBeVisible();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('con inicialAbierto el children se ve desde el primer render', () => {
    render(
      <Expandable cabecera="Cabecera" inicialAbierto={true}>
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.getByText('Contenido')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cabecera' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('con desactivado pinta cabecera y children sin botón ni triángulo', () => {
    const { container } = render(
      <Expandable cabecera="Cabecera" desactivado={true}>
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.getByText('Cabecera')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('span')).toBeNull();
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

  it('sin la prop encabezado no hay ningún heading', () => {
    render(
      <Expandable cabecera="Cabecera">
        <p>Contenido</p>
      </Expandable>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('con encabezado="h3" el heading de nivel 3 contiene el botón con aria-expanded', () => {
    render(
      <Expandable cabecera="Cabecera" encabezado="h3">
        <p>Contenido</p>
      </Expandable>,
    );

    const heading = screen.getByRole('heading', { level: 3 });
    const boton = screen.getByRole('button', { name: 'Cabecera' });
    expect(heading).toContainElement(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('con encabezado y desactivado el heading envuelve la cabecera y no hay botón', () => {
    render(
      <Expandable cabecera="Cabecera" encabezado="h3" desactivado={true}>
        <p>Contenido</p>
      </Expandable>,
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Cabecera' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
