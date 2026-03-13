import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(150).optional(),
  class_name: z.string().max(50).optional(),
  faculty: z.string().max(150).optional(),
  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  avatar_url: z.string().url('URL avatar không hợp lệ').optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  new_password: z
    .string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
}).refine(
  (data) => data.current_password !== data.new_password,
  { message: 'Mật khẩu mới phải khác mật khẩu hiện tại', path: ['new_password'] }
);

export const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || '1')),
  limit: z.string().optional().transform(v => Math.min(parseInt(v || '20'), 100)),
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'PAGE_ADMIN', 'SYSTEM_ADMIN']).optional(),
});

export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GetUsersQuery       = z.infer<typeof getUsersQuerySchema>;