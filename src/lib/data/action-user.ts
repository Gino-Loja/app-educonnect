'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { loginSchema, registerSchema } from '../validation/auth-schema'

export async function login(
  prevState: unknown,
  formData: FormData,
) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })


  if (!parsed.success) {
    // Retornamos los errores para mostrarlos en el formulario
    return {
      status: "error",
      message: parsed.error.flatten().fieldErrors,
    }
  }
  const { email, password } = parsed.data


  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      status: "error",
      message: error.message,
    }
  }


  revalidatePath('/')
  redirect('/workspace')

}

export async function signup(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("userType"),
  })

  if (!parsed.success) {
    // Retornamos los errores para mostrarlos en el formulario
    return {
      status: "error",
      message: parsed.error.flatten().fieldErrors,
    }
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      status: "error",
      message: "Las contraseñas no coinciden",
    }
  }



  const { email, password } = parsed.data
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: parsed.data.role,
      },
      emailRedirectTo: `http://localhost:3000/account/`,
    },
  })

  if (error) {
    console.error("Error al registrar: ", error)
    return {
      status: "error",
      message: error.message,
    }
  }


  revalidatePath('/signup')
  return {
    status: "success",
    message: "¡Bienvenido/a! Hemos enviado un correo electrónico de confirmación a tu correo electrónico.",
  }
}