import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be under 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const transferSchema = z.object({
  senderId: z.string().min(1, "Sender ID required"),
  receiverId: z.string().min(1, "Receiver ID required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  note: z.string().max(200, "Note too long").optional(),
});

export const updateProfileSchema = z.object({
  userId: z.string().min(1),
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s'-]+$/)
    .optional(),
  avatar: z.string().url().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
