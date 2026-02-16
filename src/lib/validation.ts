// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { z } from 'zod';

// Reusable password complexity regex
// At least one uppercase, one lowercase, one number, one special char
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
        passwordComplexityRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );

export const emailSchema = z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email is too short')
    .max(255, 'Email is too long');

export const userProfileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: emailSchema,
    phone: z.string().optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'), // Login doesn't need strictly complexity check, just existence
});

export const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
