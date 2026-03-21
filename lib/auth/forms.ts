import { z } from "zod";

export const loginFormSchema = z.object({
  userId: z.uuid({ error: "Choose an user." }),
  departmentId: z.uuid({ error: "Choose a department." }),
  pin: z
    .string()
    .trim()
    .min(1, { message: "Enter the user PIN." }),
});

export type LoginActionState = {
  message?: string;
};

export const INITIAL_LOGIN_STATE: LoginActionState = {};
