'use client'

import React, { useActionState, useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  GraduationCap,
  Users,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { login } from '@/lib/data/action-user';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const features = [
    {
      icon: Users,
      title: "Conecta con expertos",
      description: "Miles de profesores calificados esperando ayudarte"
    },
    {
      icon: Star,
      title: "Calidad garantizada",
      description: "Sistema de reseñas y calificaciones verificadas"
    },
    {
      icon: CheckCircle,
      title: "Pagos seguros",
      description: "Transacciones protegidas con garantía de satisfacción"
    }
  ];

  const [state, formAction, isPending] = useActionState(
    login,
    undefined
  )

  console.log(state)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-8">
          {/* Logo & Title */}
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
              La plataforma que conecta estudiantes con los mejores profesores para resolver cualquier tarea académica.
            </p>
          </div>

          {/* Features */}
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

          {/* Stats */}
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

        {/* Right Side - Login Form */}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido de vuelta!</h2>
              <p className="text-gray-600">Inicia sesión para continuar aprendiendo</p>
            </div>


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

            {/* Login Form */}
            <form action={formAction} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    name='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-gray-700">Recordar sesión</span>
                </label>

                <Link href="/forgot-password">
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </Link>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02] 
                   bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o continúa con</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Facebook</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                ¿No tienes cuenta?{' '}

                <Link href="/signup">
                  <button
                    type="button"
                    className={`font-medium transition-colors text-blue-600 hover:text-blue-700`}
                  >
                    Regístrate gratis
                  </button>
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
  );
};

export default LoginPage;