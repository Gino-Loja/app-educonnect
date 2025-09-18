'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Mail,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  Lock
} from 'lucide-react'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocurrió un error')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Shield,
      title: "Proceso seguro",
      description: "Tu información está protegida con encriptación SSL",
    },
    {
      icon: Clock,
      title: "Rápido y sencillo",
      description: "Recibe el enlace en tu correo en pocos minutos",
    },
    {
      icon: Lock,
      title: "Nueva contraseña",
      description: "Crea una contraseña segura para tu cuenta",
    },
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">EduConnect</h1>
                  <p className="text-blue-600 font-medium">Conectando conocimiento</p>
                </div>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed">
                Hemos enviado las instrucciones a tu correo electrónico.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Success Message */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">EduConnect</h1>
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Correo enviado!</h2>
                <p className="text-gray-600">Verifica tu bandeja de entrada</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-green-800 text-sm font-medium mb-1">
                      Instrucciones enviadas
                    </p>
                    <p className="text-green-700 text-sm">
                      Hemos enviado un enlace para restablecer tu contraseña a <strong>{email}</strong>. 
                      Revisa tu bandeja de entrada y sigue las instrucciones.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>¿No ves el correo?</strong> Revisa tu carpeta de spam o correo no deseado.
                  </p>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4", className)} {...props}>
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">EduConnect</h1>
                <p className="text-blue-600 font-medium">Conectando conocimiento</p>
              </div>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed">
              ¿Olvidaste tu contraseña? No te preocupes, te ayudamos a recuperar el acceso a tu cuenta de forma segura.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">10K+</div>
              <div className="text-sm text-gray-600">Estudiantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2K+</div>
              <div className="text-sm text-gray-600">Profesores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">50K+</div>
              <div className="text-sm text-gray-600">Tareas resueltas</div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">EduConnect</h1>
            </div>

            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</h2>
              <p className="text-gray-600">Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
            </div>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                ¿Recordaste tu contraseña?{" "}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Datos protegidos con encriptación SSL de 256 bits</p>
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
        </div>
      </div>
    </div>
  )
}