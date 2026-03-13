import { z } from 'zod';

export const registerEventSchema = z.object({
  event_id: z.string().uuid('event_id không hợp lệ'),
});

export const updateRegistrationSchema = z.object({
  status: z.enum(['APPROVED', 'ABSENT'], {
    message: 'Trạng thái không hợp lệ',
  }),
});

export const getRegistrationsQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || '1')),
  limit: z.string().optional().transform(v => Math.min(parseInt(v || '20'), 100)),
  status: z.enum(['REGISTERED', 'APPROVED', 'ATTENDED', 'ABSENT', 'CANCELLED']).optional(),
  search: z.string().optional(), // Tìm theo tên hoặc MSSV
});

export type RegisterEventInput       = z.infer<typeof registerEventSchema>;
export type UpdateRegistrationInput  = z.infer<typeof updateRegistrationSchema>;
export type GetRegistrationsQuery    = z.infer<typeof getRegistrationsQuerySchema>;