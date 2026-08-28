import { useActionState } from "react";

import styles from "./Form.module.scss";

interface Props {
		onAddFormacion: (data: FormData) => void;
}

export const FormacionForm = ({ onAddFormacion }: Props) => {
	const [state, formAction, isPending] = useActionState(
		async (prevState: unknown, queryData: FormData) =>
		onAddFormacion(queryData),
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
			<div className={styles.field}>
				<label htmlFor="institucion">Descripción:</label>
				<input type="text" id="descripcion" name="descripcion" />
			</div>
			<div className={styles.field}>
				<label htmlFor="fechaFin">Fecha de Fin:</label>
				<input type="date" id="fechaFin" name="fechaFin" required />
			</div>
			<button type="submit">Agregar Formación</button>
		</form>
	);
};