import { useConocimientoStore } from '../hooks';
import { crearPaginaCrud } from '../helpers/crearPaginaCrud';
import { ConocimientoForm } from './forms/ConocimientoForm';
import { ConocimientoCard } from './cards';

export const Conocimiento = crearPaginaCrud({
  nombre: 'conocimiento',
  titulo: 'Conocimiento',
  useStore: useConocimientoStore,
  renderCard: ({ item, onEliminar, ...resto }) => (
    <ConocimientoCard
      conocimiento={item}
      deleteConocimiento={onEliminar}
      {...resto}
    />
  ),
  renderForm: ({ enEdicion, onSubmit, ...resto }) => (
    <ConocimientoForm
      conocimientoEnEdicion={enEdicion}
      onAddConocimiento={onSubmit}
      {...resto}
    />
  ),
});
