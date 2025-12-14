'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { updateProfileDetails } from '@/application/profiles/updateProfile'
import { makeProfilesRepository } from '@/infrastructure/supabase/profiles-repo'
import { createClient } from '@/utils/supabase/server'
import { uploadToMinio, deleteFromMinio, parseObjectName } from '@/infrastructure/minio/storage'

const PROFILE_BUCKET = process.env.MINIO_PROFILE_BUCKET || "profile-pictures"

// Uploads a profile image to MinIO and returns a signed URL.
async function uploadProfileImage(file: File, profileId: string): Promise<{ path: string; url: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede ser mayor a 5MB')
  }

  const objectName = `${profileId}/${Date.now()}-${file.name}`
  const { objectName: storedName, signedUrl } = await uploadToMinio({
    bucket: PROFILE_BUCKET,
    file,
    objectName,
  })

  return { path: `${PROFILE_BUCKET}/${storedName}`, url: signedUrl }
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  profilePictureUrl: z.string().url('URL invalida').optional().or(z.literal('')),
  websiteUrl: z.string().url('URL invalida').optional().or(z.literal('')),
  linkedinUrl: z.string().url('URL invalida').optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  bio: z.string().optional(),
})

export async function updateProfile(profileId: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const profilesRepo = makeProfilesRepository(supabase)

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('profile_picture_url')
    .eq('id', profileId)
    .maybeSingle()

  // Handle storage upload if a new image was provided.
  let uploadedImageUrl: string | null = null
  const profileImageFile = formData.get('profileImage') as File

  if (profileImageFile && profileImageFile.size > 0) {
    const currentUrl = currentProfile?.profile_picture_url as string | undefined
    if (currentUrl) {
      const parsed = parseObjectName(currentUrl)
      if (parsed) {
        await deleteFromMinio(parsed.bucket, parsed.objectName)
      }
    }

    try {
      const uploaded = await uploadProfileImage(profileImageFile, profileId)
      uploadedImageUrl = uploaded.url
    } catch (error) {
      return {
        status: 'error',
        message: [error instanceof Error ? error.message : 'Error al subir la imagen'],
      }
    }
  }

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
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    bio: formData.get('bio') as string,
  }

  const parsed = profileSchema.safeParse(formDataObject)

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.flatten().fieldErrors,
    }
  }

  const profileData = {
    id: profileId,
    name: parsed.data.firstName,
    lastname: parsed.data.lastName,
    phone: parsed.data.phone || null,
    dateOfBirth: parsed.data.dateOfBirth || null,
    gender: parsed.data.gender || null,
    country: parsed.data.country || null,
    profilePictureUrl: uploadedImageUrl || parsed.data.profilePictureUrl || null,
    websiteUrl: parsed.data.websiteUrl || null,
    linkedinUrl: parsed.data.linkedinUrl || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    bio: parsed.data.bio || null,
    onboardingCompleted: true,
    profileVisibility: 'public',
  }

  const result = await updateProfileDetails(profileData, { profilesRepo })
  if (result.status === 'error') {
    return {
      status: 'error',
      message: 'Error al actualizar el perfil en la base de datos',
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/workspace/configuracion/cuenta')
  revalidatePath('/workspace/perfil')

  return {
    status: 'success',
    message: 'Perfil actualizado correctamente',
    profilePictureUrl: profileData.profilePictureUrl,
  }
}
