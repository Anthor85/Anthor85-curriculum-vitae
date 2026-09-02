import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import {
  MultiSelect,
  type MultiSelectOption,
} from '../../src/components/MultiSelect';

const OPCIONES: MultiSelectOption[] = [
  { id: '1', label: 'React' },
  { id: '2', label: 'TypeScript' },
  { id: '3', label: 'Node' },
];

const PLACEHOLDER = 'Selecciona tecnologias';

// MultiSelect es controlado: sin un padre que actualice `selected` no se puede
// assertar el repintado de los chips. El wrapper es local a este archivo.
const onChange = vi.fn();

const MultiSelectConEstado = ({
  options = OPCIONES,
  inicial = [],
}: {
  options?: MultiSelectOption[];
  inicial?: string[];
}) => {
  const [selected, setSelected] = useState<string[]>(inicial);

  return (
    <MultiSelect
      name="tecnologias"
      options={options}
      selected={selected}
      placeholder={PLACEHOLDER}
      onChange={(nuevo) => {
        onChange(nuevo);
        setSelected(nuevo);
      }}
    />
  );
};

const cabecera = () => screen.getByRole('combobox');

const opcion = (label: string) => screen.getByRole('option', { name: label });

const checkboxDe = (label: string) =>
  opcion(label).querySelector('input[type="checkbox"]') as HTMLInputElement;

describe('<MultiSelect />', () => {
  beforeEach(() => {
    onChange.mockClear();
  });

  describe('raton', () => {
    it('pinta el placeholder y no despliega la lista sin seleccion', () => {
      render(<MultiSelectConEstado />);

      expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('despliega el listbox con las tres opciones al pinchar en la cabecera', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await user.click(cabecera());

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(OPCIONES.length);
    });

    it('selecciona una opcion al pincharla y la pinta como chip', async () => {
      const user = userEvent.setup();
      const { container } = render(<MultiSelectConEstado />);

      await user.click(cabecera());
      await user.click(opcion('React'));

      expect(onChange).toHaveBeenCalledWith(['1']);
      expect(opcion('React')).toHaveAttribute('aria-selected', 'true');
      expect(checkboxDe('React')).toBeChecked();
      expect(
        screen.getByRole('button', { name: 'Quitar React' }),
      ).toBeInTheDocument();

      const oculto = container.querySelector('input[type="hidden"]');
      expect(oculto).toHaveAttribute('name', 'tecnologias');
      expect(oculto).toHaveValue('1');
    });

    it('deselecciona la opcion al volver a pincharla', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await user.click(cabecera());
      await user.click(opcion('React'));
      await user.click(opcion('React'));

      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(opcion('React')).toHaveAttribute('aria-selected', 'false');
      expect(checkboxDe('React')).not.toBeChecked();
      expect(
        screen.queryByRole('button', { name: 'Quitar React' }),
      ).not.toBeInTheDocument();
    });

    it('quita el chip y desmarca la opcion al pulsar el boton Quitar', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await user.click(cabecera());
      await user.click(opcion('React'));

      await user.click(screen.getByRole('button', { name: 'Quitar React' }));

      expect(onChange).toHaveBeenLastCalledWith([]);
      expect(
        screen.queryByRole('button', { name: 'Quitar React' }),
      ).not.toBeInTheDocument();
      expect(checkboxDe('React')).not.toBeChecked();
    });

    it('cierra el desplegable al pinchar fuera del componente', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await user.click(cabecera());
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('no pinta ninguna opcion cuando options esta vacio', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado options={[]} />);

      await user.click(cabecera());

      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('teclado', () => {
    // El foco se aplica en un useEffect: los asserts van despues del await de
    // la interaccion de userEvent, que ya envuelve el render en act().
    const abrirConTeclado = async (
      user: ReturnType<typeof userEvent.setup>,
      tecla: string,
    ) => {
      cabecera().focus();
      await user.keyboard(tecla);
    };

    it('abre el desplegable y enfoca la primera opcion con ArrowDown en la cabecera', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await abrirConTeclado(user, '{ArrowDown}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(opcion('React')).toHaveFocus();
    });

    it('abre el desplegable y enfoca la ultima opcion con ArrowUp en la cabecera', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await abrirConTeclado(user, '{ArrowUp}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(opcion('Node')).toHaveFocus();
    });

    it('alterna con Enter y cierra con Escape desde la cabecera', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await abrirConTeclado(user, '{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Enter}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('mueve el foco de forma circular con ArrowDown y ArrowUp sobre las opciones', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await abrirConTeclado(user, '{ArrowDown}');
      expect(opcion('React')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(opcion('TypeScript')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(opcion('Node')).toHaveFocus();

      // De la ultima a la primera.
      await user.keyboard('{ArrowDown}');
      expect(opcion('React')).toHaveFocus();

      // Y de la primera a la ultima.
      await user.keyboard('{ArrowUp}');
      expect(opcion('Node')).toHaveFocus();
    });

    it('selecciona con Enter o espacio y cierra con Escape devolviendo el foco a la cabecera', async () => {
      const user = userEvent.setup();
      render(<MultiSelectConEstado />);

      await abrirConTeclado(user, '{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenLastCalledWith(['1']);
      expect(opcion('React')).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{ArrowDown} ');

      expect(onChange).toHaveBeenLastCalledWith(['1', '2']);
      expect(opcion('TypeScript')).toHaveAttribute('aria-selected', 'true');

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(cabecera()).toHaveFocus();
    });
  });
});
