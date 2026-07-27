import {
  CreateUploadToken,
  CreatedUploadToken,
  UploadToken,
} from "../types/uploadToken.type";
import api from "./api.service";

const list = async (): Promise<UploadToken[]> => {
  return (await api.get("uploadTokens")).data;
};

const create = async (
  token: CreateUploadToken,
): Promise<CreatedUploadToken> => {
  return (await api.post("uploadTokens", token)).data;
};

const revoke = async (id: string): Promise<UploadToken> => {
  return (await api.delete(`uploadTokens/${id}`)).data;
};

export default {
  list,
  create,
  revoke,
};
