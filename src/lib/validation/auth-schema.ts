import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
  role: z.string(),
})
