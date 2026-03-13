import { z } from 'zod';

export const createPageSchema = z.object({
  name: z.string().min(3, 'Tên CLB phải có ít nhất 3 ký tự').max(255),
  slug: z
    .string()
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug chỉ được chứa chữ thường, số và dấu gạch ngang (VD: clb-hoc-thuat)'
    ),
  description: z.string().max(2000).optional(),
  avatar_url: z.string().url('URL avatar không hợp lệ').optional(),
  cover_url: z.string().url('URL ảnh bìa không hợp lệ').optional(),
});

export const updatePageSchema = createPageSchema.partial();

export const addMemberSchema = z.object({
  user_id: z.string().uuid('user_id không hợp lệ'),
  is_owner: z.boolean().default(false),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type AddMemberInput  = z.infer<typeof addMemberSchema>;