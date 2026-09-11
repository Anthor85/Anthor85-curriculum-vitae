import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../../src/components/Button';

describe('<Button />', () => {
  it('pinta el name recibido por props', () => {
    render(<Button onClick={vi.fn()} name="Guardar" />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('pinta el icono indicado en icon, oculto a lectores de pantalla', () => {
    const { container } = render(
      <Button onClick={vi.fn()} name="Descargar" icon="descarga" />,
    );

    const icono = container.querySelector('[data-icon]');
    expect(icono).toBeInTheDocument();
    expect(icono).toHaveAttribute('data-icon', 'descarga');
    expect(icono).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByRole('button', { name: 'Descargar' }),
    ).toBeInTheDocument();
  });

  it('no pinta ningun icono cuando no recibe icon', () => {
    const { container } = render(<Button onClick={vi.fn()} name="Guardar" />);

    expect(container.querySelector('[data-icon]')).toBeNull();
  });

  it('llama a onClick una vez al pulsar el boton', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} name="Guardar" />);

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
