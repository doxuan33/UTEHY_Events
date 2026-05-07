import { apiClient } from './client';

export interface CreatePageParams {
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
}

export interface UpdatePageParams extends Partial<CreatePageParams> {}

export interface AddMemberParams {
  user_id: string;
  is_owner?: boolean;
}

export const pagesApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) => 
    apiClient.get('/pages', { params }),
    
  getFollowing: () => 
    apiClient.get('/pages/following'),
    
  getBySlug: (slug: string) => 
    apiClient.get(`/pages/${slug}`),
    
  create: (data: CreatePageParams) => 
    apiClient.post('/pages', data),
    
  update: (id: string, data: UpdatePageParams) => 
    apiClient.patch(`/pages/${id}`, data),

  lock: (id: string) =>
    apiClient.patch(`/pages/${id}/lock`),

  unlock: (id: string) =>
    apiClient.patch(`/pages/${id}/unlock`),
    
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.patch(`/pages/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadCover: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('cover', file);
    return apiClient.patch(`/pages/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
    
  follow: (id: string) => 
    apiClient.post(`/pages/${id}/follow`),
    
  unfollow: (id: string) => 
    apiClient.delete(`/pages/${id}/follow`),
    
  addMember: (id: string, data: AddMemberParams) => 
    apiClient.post(`/pages/${id}/members`, data),
    
  removeMember: (id: string, userId: string) => 
    apiClient.delete(`/pages/${id}/members/${userId}`),
};
