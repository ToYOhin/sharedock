import api from "./api.service";

export interface SystemInfo {
  used: number;
  total: number;
}

export interface ExpiringShare {
  id: string;
  name: string | null;
  expiration: string;
  fileCount: number;
}

export interface SystemOverview {
  diskUsage: SystemInfo | null;
  shareCount: number;
  fileCount: number;
  recentShareCount: number;
  expiringShares: ExpiringShare[];
}

const getSystemInfo = async (): Promise<SystemInfo | null> => {
  return (await api.get("system/info")).data;
};

const getSystemOverview = async (): Promise<SystemOverview> => {
  return (await api.get("system/overview")).data;
};

export default { getSystemInfo, getSystemOverview };
