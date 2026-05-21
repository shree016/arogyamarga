import { z } from "zod";
import { roleList } from "@/lib/permissions";

export const intakeSchema = z.object({
  symptoms: z
    .string()
    .min(3, "Please enter a few words about your symptoms.")
    .max(240, "Keep the summary under 240 characters."),
});

export const loginSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  age: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  role: z.enum(roleList),
});
