export interface Perfil {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  descripcion: string;
  foto?: string;
}

export interface PerfilPayload extends Omit<Perfil, 'id'> {
  foto: string;
}
