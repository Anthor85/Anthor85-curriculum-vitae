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
      const tecnologias = formData.getAll("tecnologias").join(",");

      formData.delete("tecnologias");
      formData.append("tecnologias", tecnologias); // Append an empty value to avoid issues

      const { data } = await api.post("/experiencia", formData);

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
