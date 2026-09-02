import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../../src/components/Button';

describe('<Button />', () => {
  it('pinta el name recibido por props', () => {
    render(<Button onClick={vi.fn()} name="Guardar" />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('pinta el icono con la clase icon-{icon} cuando recibe icon', () => {
    const { container } = render(
      <Button onClick={vi.fn()} name="Borrar" icon="trash" />,
    );

    const icono = container.querySelector('i');
    expect(icono).toBeInTheDocument();
    expect(icono).toHaveClass('icon-trash');
  });

  it('no pinta ningun icono cuando no recibe icon', () => {
    const { container } = render(<Button onClick={vi.fn()} name="Guardar" />);

    expect(container.querySelector('i')).toBeNull();
  });

  it('llama a onClick una vez al pulsar el boton', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} name="Guardar" />);

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
