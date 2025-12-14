'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateProfile } from '@/lib/data/profile-actions'
import { CheckCircle, Upload, X, User, MapPin, Globe, FileText, GraduationCap, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileFormProps {
    profileId: string
    initialData?: {
        name?: string
        lastname?: string
        phone?: string
        date_of_birth?: string
        gender?: string
        country?: string
        profile_picture_url?: string
        website_url?: string
        linkedin_url?: string
        city?: string
        state?: string
        bio?: string
    }
    compact?: boolean
}

type UpdateProfileState = {
    status: "success" | "error"
    message?: unknown
    profilePictureUrl?: string | null
}

export default function ProfileForm({ profileId, initialData, compact = false }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(
        updateProfile.bind(null, profileId),
        undefined
    )

    const [imagePreview, setImagePreview] = useState<string | null>(
        initialData?.profile_picture_url || null
    )
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [lastSavedUrl, setLastSavedUrl] = useState<string | null>(initialData?.profile_picture_url || null)

    // Si el server action devuelve una nueva URL, actualiza la vista previa
    useEffect(() => {
        if (!state || typeof state !== "object") return
        const payload = state as UpdateProfileState
        if (payload.status === "success" && payload.profilePictureUrl && payload.profilePictureUrl !== lastSavedUrl) {
            setLastSavedUrl(payload.profilePictureUrl)
            setImagePreview(payload.profilePictureUrl)
            setSelectedFile(null)
        }
    }, [state, lastSavedUrl])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearImage = () => {
        setSelectedFile(null)
        setImagePreview(initialData?.profile_picture_url || null)
        const fileInput = document.getElementById('profileImage') as HTMLInputElement
        if (fileInput) {
            fileInput.value = ''
        }
    }

    return (
        <div className={compact ? "" : "min-h-screen bg-gradient-to-br"}>
            <div className={compact ? "p-4" : "max-w-6xl mx-auto p-4"}>
                {/* Header Section */}
                {!compact && (
                    <div className="text-center mb-8 space-y-4">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">EduConnect</h1>
                                <p className="text-blue-600 font-medium">Conectando conocimiento</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-600">Actualiza tu información personal y preferencias</p>
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {state && state.status === "error" && (
                    <div className="mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">
                                {state.message?.toString() || "Error al actualizar el perfil"}
                            </p>
                        </div>
                    </div>
                )}

                {state && state.status === "success" && (
                    <div className="mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="text-green-800 text-sm font-medium mb-1">
                                        ¡Perfil actualizado!
                                    </p>
                                    <p className="text-green-700 text-sm">
                                        {typeof state?.message === "string" ? state.message : "Tu información ha sido guardada correctamente"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form action={formAction} className="space-y-8">
                    {/* Profile Picture Section */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                                <User className="w-6 h-6" />
                                Foto de Perfil
                            </h3>
                            <p className="text-blue-100 mt-1">Sube o actualiza tu imagen de perfil</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* Avatar Display */}
                                <div className="flex justify-center lg:justify-start">
                                    <div className="relative">
                                        <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                                            <AvatarImage
                                                src={imagePreview || undefined}
                                                alt="Profile picture"
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                                                {initialData?.name?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {(selectedFile || imagePreview) && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-white shadow-lg hover:bg-red-50 border-2"
                                                onClick={clearImage}
                                            >
                                                <X className="h-5 w-5 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Controls */}
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="profileImage" className="text-sm font-medium text-gray-700 mb-2 block">
                                            Subir nueva imagen
                                        </Label>
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                htmlFor="profileImage"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors group"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-3 text-blue-500 group-hover:text-blue-600" />
                                                    <p className="text-sm text-blue-600 font-medium mb-1">
                                                        Hacer clic para subir archivo
                                                    </p>
                                                    <p className="text-xs text-blue-500">
                                                        PNG, JPG o GIF (máx. 10MB)
                                                    </p>
                                                </div>
                                                <input
                                                    id="profileImage"
                                                    name="profileImage"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                                <User className="w-6 h-6" />
                                Información Personal
                            </h3>
                            <p className="text-blue-100 mt-1">Datos básicos de tu perfil</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                        Nombre *
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        defaultValue={initialData?.name || ''}
                                        required
                                        className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                                        Apellido *
                                    </Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        defaultValue={initialData?.lastname || ''}
                                        required
                                        className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                        Celular
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+593123456789"
                                        defaultValue={initialData?.phone || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                                        Fecha de Nacimiento
                                    </Label>
                                    <Input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        defaultValue={initialData?.date_of_birth || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                                        Género
                                    </Label>
                                    <Select name="gender" defaultValue={initialData?.gender || ''}>
                                        <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                            <SelectValue placeholder="Seleccionar género" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Masculino</SelectItem>
                                            <SelectItem value="female">Femenino</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                                        País
                                    </Label>
                                    <Input
                                        id="country"
                                        name="country"
                                        placeholder="Ecuador"
                                        defaultValue={initialData?.country || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Information Section */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-3">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                                <MapPin className="w-6 h-6" />
                                Información de Ubicación
                            </h3>
                            <p className="text-purple-100 mt-1">Detalles sobre tu ubicación actual</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                                        Ciudad
                                    </Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        placeholder="El coca"
                                        defaultValue={initialData?.city || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                                        Estado/Provincia
                                    </Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        placeholder="Orellana"
                                        defaultValue={initialData?.state || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-3">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                                <Globe className="w-6 h-6" />
                                Redes Sociales y Enlaces
                            </h3>
                            <p className="text-green-100 mt-1">Conecta tus perfiles y sitios web</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="websiteUrl" className="text-sm font-medium text-gray-700">
                                        Sitio Web
                                    </Label>
                                    <Input
                                        id="websiteUrl"
                                        name="websiteUrl"
                                        type="url"
                                        placeholder="https://tusitio.com"
                                        defaultValue={initialData?.website_url || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedinUrl" className="text-sm font-medium text-gray-700">
                                        LinkedIn
                                    </Label>
                                    <Input
                                        id="linkedinUrl"
                                        name="linkedinUrl"
                                        type="url"
                                        placeholder="https://linkedin.com/in/tu-perfil"
                                        defaultValue={initialData?.linkedin_url || ''}
                                        className="border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Biography Section */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-3">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                                <FileText className="w-6 h-6" />
                                Biografía
                            </h3>
                            <p className="text-orange-100 mt-1">Cuéntanos sobre ti y tus intereses</p>
                        </div>

                        <div className="p-8">
                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                                    Acerca de ti
                                </Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    rows={6}
                                    placeholder="Comparte tu experiencia, intereses, logros académicos o profesionales..."
                                    defaultValue={initialData?.bio || ''}
                                    className="resize-none border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                                <p className="text-sm text-gray-500">
                                    Máximo 500 caracteres
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-8 border-t border-gray-200">

                        <Button
                            type="submit"
                            disabled={isPending}
                            className=" py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Actualizar Perfil
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Trust Indicators */}
                {!compact && (
                    <div className="mt-8 text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-4 mt-2">
                            <span className="flex items-center space-x-1">
                                <CheckCircle size={14} className="text-green-500" />
                                <span>Seguro</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <CheckCircle size={14} className="text-green-500" />
                                <span>Verificado</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <CheckCircle size={14} className="text-green-500" />
                                <span>Confiable</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
