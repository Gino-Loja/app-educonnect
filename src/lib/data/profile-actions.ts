'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server' // Ajusta la ruta según tu proyecto

// Función auxiliar para subir imagen a Supabase Storage
async function uploadProfileImage(file: File, profileId: string): Promise<string | null> {
  const supabase = await createClient()
  
  // Verificar que es una imagen
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }
  
  // Verificar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede ser mayor a 5MB')
  }
  
  // Crear nombre único para el archivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${profileId}-${Date.now()}.${fileExt}`
  
  try {
    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures') // Asegúrate de que este bucket exista
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Error subiendo imagen:', error)
      throw new Error('Error al subir la imagen')
    }
    
    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(data.path)
    
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error en uploadProfileImage:', error)
    throw error
  }
}

// Esquema de validación
const profileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  profilePictureUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  websiteUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  linkedinUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  bio: z.string().optional(),
})

export async function updateProfile(profileId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  // Manejar la subida de imagen si existe
  let uploadedImageUrl: string | null = null
  const profileImageFile = formData.get('profileImage') as File
  
  if (profileImageFile && profileImageFile.size > 0) {
    try {
      uploadedImageUrl = await uploadProfileImage(profileImageFile, profileId)
    } catch (error) {
      return {
        status: "error",
        message: [error instanceof Error ? error.message : 'Error al subir la imagen'] 
        
      }
    }
  }
  
  // Validar los datos del formulario
  const formDataObject = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    dateOfBirth: formData.get('dateOfBirth') as string,
    gender: formData.get('gender') as string,
    country: formData.get('country') as string,
    profilePictureUrl: formData.get('profilePictureUrl') as string,
    websiteUrl: formData.get('websiteUrl') as string,
    linkedinUrl: formData.get('linkedinUrl') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    bio: formData.get('bio') as string,
  }

  const parsed = profileSchema.safeParse(formDataObject)

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const profileData = {
      name: parsed.data.firstName,
      lastname: parsed.data.lastName,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.dateOfBirth || null,
      gender: parsed.data.gender || null,
      country: parsed.data.country || null,
      // Si se subió una nueva imagen, usar esa URL, sino usar la URL manual si existe
      profile_picture_url: uploadedImageUrl || parsed.data.profilePictureUrl || null,
      website_url: parsed.data.websiteUrl || null,
      linkedin_url: parsed.data.linkedinUrl || null,
      // address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      bio: parsed.data.bio || null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...profileData, onboarding_completed: true, profile_visibility: 'public' })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando perfil:', error);
      return {
        status: "error",
        message: 'Error al actualizar el perfil en la base de datos'
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    
    return {
      status: "success",
      message: "Perfil actualizado correctamente",
    }

  } catch (error) {
    console.error('Error en updateProfile:', error);
    return {
      status: "error",
      message: 'Error inesperado al actualizar el perfil'
    }
  }
}