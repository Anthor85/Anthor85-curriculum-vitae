import api from "../../api/api";
import { Experiencia } from "../../interfaces/experiencia.interface";

export const createExperienciaAction = async (data: FormData) => {
  try {
    const response = await api.post<Experiencia>("/experiencia", data);
    return response.data;
  } catch (error) {
    console.error("Error creating experiencia:", error);
    throw error;
  }
};
