import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
import { setPerfil } from '../store';


export const usePerfilStore = () => {
	const dispatch = useDispatch();
	const { perfil, loading, error } = useSelector((state: any) => state.perfil);

	const getPerfil = async () => {
		try {
			const { data } = await api.get('/perfil');
			console.log("Perfil data:", data);

			dispatch(setPerfil(data));
		} catch (error) {
			console.error('Error fetching formacion:', error);
		}
	};

	const createPerfil = async (formData: FormData) => {
		try {
			const { data } = await api.post('/perfil', formData);

			dispatch(setPerfil([...perfil, data]));
		} catch (error) {
			console.error('Error creating perfil:', error);
		}
	};

	const deletePerfil = async (id: string) => {
		try {
			const { data } = await api.delete(`/perfil/${id}`);
			console.log('Perfil deleted:', perfil, data);
				
			dispatch(
				setFormacion(perfil.filter((form: any) => form.id !== data.perfil.id))
			);
		} catch (error) {
			console.error('Error deleting perfil:', error);
		}
	};

	return {
		perfil,
		loading,
		error,

		getPerfil,
		createPerfil,
		deletePerfil,
	};
};
