import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at leasy 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: passwordSchema,
  workspaceName: z.string().min(1, "Workspace name is required").max(100),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is requird"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is "),
});

export const forgetPasswordSchema = z.object({
  email: z.string().min(1, "Token is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});

export const completeProfileSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
