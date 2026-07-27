import { CleanupPreview } from "../types/cleanupPreview.type";
import api from "./api.service";

const getCleanupPreview = async (): Promise<CleanupPreview> => {
  return (await api.get("jobs/cleanup-preview")).data;
};

export default { getCleanupPreview };
