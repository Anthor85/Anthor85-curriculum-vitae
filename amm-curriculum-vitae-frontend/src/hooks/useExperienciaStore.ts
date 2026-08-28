import { useDispatch, useSelector } from "react-redux";
import api from "../api/api";
import { setExperiencia } from "../store";

export const useExperienciaStore = () => {
  const dispatch = useDispatch();
  const { experiencia, loading, error } = useSelector(
    (state: any) => state.experiencia
  );

  const getExperiencia = async () => {
    try {
      const { data } = await api.get("/experiencia");
      console.log("Experiencia data:", data);

      dispatch(setExperiencia(data));
    } catch (error) {
      console.error("Error fetching experiencia:", error);
    }
  };

  const createExperiencia = async (formData: FormData) => {
    try {
      const campos = Object.fromEntries(formData);
      delete campos.tecnologias;
      delete campos.hitos;

      const payload = {
        ...campos,
        tecnologias: formData.getAll("tecnologias") as string[],
        hitos: (formData.getAll("hitos") as string[])
          .map((hito) => hito.trim())
          .filter((hito) => hito !== ""),
      };

      console.log("Experiencia payload:", payload);

      const { data } = await api.post("/experiencia", payload);

      dispatch(setExperiencia([...experiencia, data]));
    } catch (error) {
      console.error("Error creating experiencia:", error);
    }
  };

  const deleteExperiencia = async (id: string) => {
    try {
      const { data } = await api.delete(`/experiencia/${id}`);
      console.log("Experiencia deleted:", data);

      dispatch(
        setExperiencia(experiencia.filter((exp: any) => exp.id !== data.experiencia.id))
      );
    } catch (error) {
      console.error("Error deleting experiencia:", error);
    }
  };

  return {
    experiencia,
    loading,
    error,

    createExperiencia,
    deleteExperiencia,
    getExperiencia,
  };
};
