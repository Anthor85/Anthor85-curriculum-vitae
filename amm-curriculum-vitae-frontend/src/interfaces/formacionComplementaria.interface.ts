export interface FormacionComplementaria {
  id: string;
  titulo: string;
  institucion: string;
}

export interface FormacionComplementariaState {
  formacionComplementaria: FormacionComplementaria[];
  loading: boolean;
  error: string | null;
}

export interface FormacionComplementariaAction {
  type: string;
  payload: any;
}

export type FormacionComplementariaDispatch = (
  action: FormacionComplementariaAction,
) => void;
