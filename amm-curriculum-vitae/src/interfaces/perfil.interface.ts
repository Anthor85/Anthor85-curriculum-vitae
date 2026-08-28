export interface Perfil {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
    fechaNacimiento: Date;
    descripcion: string;
    foto: string;
}

export interface PerfilState {
    perfil: Perfil | null;
    loading: boolean;
    error: string | null;
}

export interface PerfilAction {
    type: string;
    payload: any;
}

export type PerfilDispatch = (action: PerfilAction) => void;