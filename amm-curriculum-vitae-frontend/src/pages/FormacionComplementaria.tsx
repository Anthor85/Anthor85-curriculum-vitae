import { useFormacionComplementariaStore } from '../hooks';
import { crearPaginaCrud } from '../helpers/crearPaginaCrud';
import { FormacionComplementariaForm } from './forms/FormacionComplementariaForm';
import { FormacionComplementariaCard } from './cards';

export const FormacionComplementaria = crearPaginaCrud({
  nombre: 'formacionComplementaria',
  titulo: 'Formación Complementaria',
  femenino: true,
  useStore: useFormacionComplementariaStore,
  renderCard: ({ item, onEliminar, ...resto }) => (
    <FormacionComplementariaCard
      formacionComplementaria={item}
      deleteFormacionComplementaria={onEliminar}
      {...resto}
    />
  ),
  renderForm: ({ enEdicion, onSubmit, ...resto }) => (
    <FormacionComplementariaForm
      formacionComplementariaEnEdicion={enEdicion}
      onSubmitFormacionComplementaria={onSubmit}
      {...resto}
    />
  ),
});
