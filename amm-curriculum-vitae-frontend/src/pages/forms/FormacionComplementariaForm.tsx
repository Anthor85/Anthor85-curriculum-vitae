import { useActionState } from "react";

import styles from "./Form.module.scss";

interface Props {
		onAddFormacionComplementaria: (data: FormData) => void;
}

export const FormacionComplementariaForm = ({ onAddFormacionComplementaria }: Props) => {
	const [state, formAction, isPending] = useActionState(
		async (prevState: unknown, queryData: FormData) =>
		onAddFormacionComplementaria(queryData),
		null
	);

	return (
		<form action={formAction} className={styles.Form}>
			<div className={styles.field}>
				<label htmlFor="titulo">Título:</label>
				<input type="text" id="titulo" name="titulo" required />
			</div>
			<div className={styles.field}>
				<label htmlFor="institucion">Institución:</label>
				<input type="text" id="institucion" name="institucion" required />
			</div>
			<button type="submit">Agregar Formación Complementaria</button>
		</form>
	);
};