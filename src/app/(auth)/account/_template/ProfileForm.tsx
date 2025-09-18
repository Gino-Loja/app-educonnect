'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/lib/data/profile-actions'
import { CheckCircle, Upload, X, User, MapPin, Globe, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
        address?: string
        city?: string
        state?: string
        bio?: string
    }
}

type FormState = {
    status: 'success' | 'error' | null
    message: string | {
        firstName?: string[]
        lastName?: string[]
        phone?: string[]
        dateOfBirth?: string[]
        gender?: string[]
        country?: string[]
        profileImage?: string[]
        profilePictureUrl?: string[]
        websiteUrl?: string[]
        linkedinUrl?: string[]
        address?: string[]
        city?: string[]
        state?: string[]
        bio?: string[]
        general?: string[]
    } | null
    data?: any
}

const initialState: FormState = {
    status: null,
    message: null,
}

export default function ProfileForm({ profileId, initialData }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(
        updateProfile.bind(null, profileId),
        undefined
    )

    const [imagePreview, setImagePreview] = useState<string | null>(
        initialData?.profile_picture_url || null
    )
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Perfil de EduConnect</h1>
                <p className="text-gray-600">Actualiza tu información personal y preferencias</p>
            </div>

            {/* Status Messages */}
            {state && state.status === "error" && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {state.message?.toString() || "Error al actualizar el perfil"}
                    </AlertDescription>
                </Alert>
            )}

            {state && state.status === "success" && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {typeof state?.message === "string" ? state.message : "Perfil actualizado correctamente"}
                    </AlertDescription>
                </Alert>
            )}

            <form action={formAction} className="space-y-6">
                {/* Profile Picture Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Foto de Perfil
                        </CardTitle>
                        <CardDescription>Sube o actualiza tu imagen de perfil</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            {/* Avatar Display */}
                            <div className="flex justify-center lg:justify-start">
                                <div className="relative">
                                    <Avatar className="w-32 h-32">
                                        <AvatarImage 
                                            src={imagePreview || undefined} 
                                            alt="Profile picture" 
                                        />
                                        <AvatarFallback className="text-3xl">
                                            {initialData?.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {(selectedFile || imagePreview) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                                            onClick={clearImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Upload Controls */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="profileImage" className="sr-only">
                                        Subir imagen
                                    </Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="profileImage"
                                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                                <Upload className="w-6 h-6 mb-2 text-gray-500" />
                                                <p className="text-sm text-gray-500 font-medium">
                                                    Hacer clic para subir archivo
                                                </p>
                                                <p className="text-xs text-gray-400">
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

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">O</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profilePictureUrl">URL de imagen</Label>
                                    <Input
                                        id="profilePictureUrl"
                                        name="profilePictureUrl"
                                        type="url"
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        defaultValue={initialData?.profile_picture_url || ''}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Información Personal
                        </CardTitle>
                        <CardDescription>Datos básicos de tu perfil</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    defaultValue={initialData?.name || ''}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    defaultValue={initialData?.lastname || ''}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+52 555 123 4567"
                                    defaultValue={initialData?.phone || ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                                <Input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    defaultValue={initialData?.date_of_birth || ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Género</Label>
                                <Select name="gender" defaultValue={initialData?.gender || ''}>
                                    <SelectTrigger>
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
                                <Label htmlFor="country">País</Label>
                                <Input
                                    id="country"
                                    name="country"
                                    placeholder="México"
                                    defaultValue={initialData?.country || ''}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Información de Ubicación
                        </CardTitle>
                        <CardDescription>Detalles sobre tu ubicación actual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="Ciudad de México"
                                    defaultValue={initialData?.city || ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">Estado/Provincia</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    placeholder="CDMX"
                                    defaultValue={initialData?.state || ''}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="Calle, número, colonia..."
                                    defaultValue={initialData?.address || ''}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Redes Sociales y Enlaces
                        </CardTitle>
                        <CardDescription>Conecta tus perfiles y sitios web</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Sitio Web</Label>
                                <Input
                                    id="websiteUrl"
                                    name="websiteUrl"
                                    type="url"
                                    placeholder="https://tusitio.com"
                                    defaultValue={initialData?.website_url || ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                                <Input
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    type="url"
                                    placeholder="https://linkedin.com/in/tu-perfil"
                                    defaultValue={initialData?.linkedin_url || ''}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Biography Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Biografía
                        </CardTitle>
                        <CardDescription>Cuéntanos sobre ti y tus intereses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Acerca de ti</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                rows={6}
                                placeholder="Comparte tu experiencia, intereses, logros académicos o profesionales..."
                                defaultValue={initialData?.bio || ''}
                                className="resize-none"
                            />
                            <p className="text-sm text-gray-500">
                                Máximo 500 caracteres
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 border-t">
                    <Button type="button" variant="outline" className="sm:w-auto">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending} className="sm:w-auto">
                        {isPending ? 'Actualizando...' : 'Actualizar Perfil'}
                    </Button>
                </div>
            </form>
        </div>
    )
}