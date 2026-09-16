import { useExperienciaStore } from '../hooks';
import { crearPaginaCrud } from '../helpers/crearPaginaCrud';
import { ExperienciaForm } from './forms/ExperienciaForm';
import { ExperienciaCard } from './cards/ExperienciaCard';

export const Experiencia = crearPaginaCrud({
  nombre: 'experiencia',
  titulo: 'Experiencia',
  femenino: true,
  useStore: useExperienciaStore,
  renderCard: ({ item, onEliminar, ...resto }) => (
    <ExperienciaCard
      experiencia={item}
      deleteExperiencia={onEliminar}
      {...resto}
    />
  ),
  renderForm: ({ enEdicion, onSubmit, ...resto }) => (
    <ExperienciaForm
      experienciaEnEdicion={enEdicion}
      onAddExperiencia={onSubmit}
      {...resto}
    />
  ),
});
