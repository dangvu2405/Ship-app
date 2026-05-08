import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  .regex(/[A-Z]/, { message: 'Cần ít nhất một chữ Latin in hoa' })
  .regex(/[a-z]/, { message: 'Cần ít nhất một chữ Latin thường' })
  .regex(/[0-9]/, { message: 'Cần ít nhất một chữ số' });

export const forgotPasswordConfirmSchema = z
  .object({
    password: strongPasswordSchema,
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['password_confirmation'],
  });

export type ForgotPasswordConfirmValues = z.infer<typeof forgotPasswordConfirmSchema>;

export const registerSchema = z
  .object({
    username: z.string().min(2, { message: 'Tên đăng nhập tối thiểu 2 ký tự' }),
    email: z.string().email({ message: 'Email không hợp lệ' }),
    password: strongPasswordSchema,
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['password_confirmation'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
