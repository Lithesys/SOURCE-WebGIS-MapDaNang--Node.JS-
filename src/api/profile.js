import { api } from 'boot/axios';

export const updateProfile = async (params) => {
  const response = await api.put(`profile/${params.id}`, params);
  return response.data
}
