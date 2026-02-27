import { z } from "zod";

const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number");

export const signInCredentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    marketingOptIn: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type SignInCredentialsInput = z.infer<typeof signInCredentialsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
