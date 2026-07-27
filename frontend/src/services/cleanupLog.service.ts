import { CleanupLog } from "../types/cleanupLog.type";
import api from "./api.service";

const getCleanupLogs = async (): Promise<CleanupLog[]> => {
  return (await api.get("jobs/cleanup-logs")).data;
};

export default { getCleanupLogs };
