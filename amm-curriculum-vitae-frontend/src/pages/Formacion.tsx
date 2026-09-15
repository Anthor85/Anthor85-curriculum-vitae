import { useFormacionStore } from '../hooks';
import { crearPaginaCrud } from '../helpers/crearPaginaCrud';
import { FormacionForm } from './forms/FormacionForm';
import { FormacionCard } from './cards';

export const Formacion = crearPaginaCrud({
  nombre: 'formacion',
  titulo: 'Formación',
  femenino: true,
  useStore: useFormacionStore,
  renderCard: ({ item, onEliminar, ...resto }) => (
    <FormacionCard formacion={item} deleteFormacion={onEliminar} {...resto} />
  ),
  renderForm: ({ enEdicion, onSubmit, ...resto }) => (
    <FormacionForm
      formacionEnEdicion={enEdicion}
      onSubmitFormacion={onSubmit}
      {...resto}
    />
  ),
});
