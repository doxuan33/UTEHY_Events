import { apiClient } from './client';

export interface ScanQrParams {
  token: string;
  latitude?: number;
  longitude?: number;
}

export interface ManualCheckinParams {
  event_id: string;
  student_id: string;
}

export const checkinApi = {
  // Student
  scanQr: (data: ScanQrParams) =>
    apiClient.post('/checkin/scan', data),

  // Page Admin
  startCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/start`),

  endCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/end`),

  manualCheckin: (data: ManualCheckinParams) =>
    apiClient.post('/checkin/manual', data),

  getCurrentToken: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/token`),

  getHistory: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/history`),

  // SSE Stream URL
  getStreamUrl: (eventId: string, token: string) => 
    `${apiClient.defaults.baseURL}/checkin/events/${eventId}/stream?token=${token}`,
};
