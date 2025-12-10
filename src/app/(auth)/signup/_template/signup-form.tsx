"use client"

import { useActionState, useState } from "react"
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    GraduationCap,
    Users,
    Star,
    ArrowRight,
    CheckCircle,
} from "lucide-react"
import { signup } from "@/lib/data/action-user"
//https://www.workana.com/es/signup

//

const SignupForm = ({ userType }: { userType: string }) => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }
    const [errorMessage, formAction, isPending] = useActionState(
        signup,
        undefined,
    );

    const features = [
        {
            icon: Users,
            title: "Conecta con expertos",
            description: "Miles de profesores calificados esperando ayudarte",
        },
        {
            icon: Star,
            title: "Calidad garantizada",
            description: "Sistema de reseñas y calificaciones verificadas",
        },
        {
            icon: CheckCircle,
            title: "Pagos seguros",
            description: "Transacciones protegidas con garantía de satisfacción",
        },
    ]
    

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
                            Únete a la plataforma que conecta estudiantes con los mejores profesores para resolver cualquier tarea
                            académica.
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

                {/* Right Side - Register Form */}
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Crea tu cuenta!</h2>
                            <p className="text-gray-600">Únete a nuestra comunidad educativa</p>
                        </div>

                        {errorMessage && errorMessage.status === "error" && (
                            <p className="text-red-500 text-sm text-center">{errorMessage.message.toString()}</p>
                        )}
                        {errorMessage && errorMessage.status === "success" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="text-green-800 text-sm font-medium">
                                        {typeof errorMessage?.message === "string"
                                            ? errorMessage.message
                                            : JSON.stringify(errorMessage.message)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Register Form */}
                        <form action={formAction} className="space-y-6">
                            {/* Name Fields */}
                            <input type="hidden" name="userType" value={userType} />
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
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                                        placeholder="tu@email.com"
                                        required
                                        name="email"
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
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                        name="password"
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

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Confirmar contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                                        placeholder="••••••••"
                                        name="confirmPassword"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    required
                                />
                                <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                                    Acepto los{" "}
                                    <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                                        términos y condiciones
                                    </button>{" "}
                                    y la{" "}
                                    <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                                        política de privacidad
                                    </button>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02] ${userType === "student"
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/25"
                                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creando cuenta...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Crear cuenta</span>
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
                                <span className="px-2 bg-white text-gray-500">o regístrate con</span>
                            </div>
                        </div>

                        {/* Social Register */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Continuar con Google</span>
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center mt-6 pt-6 border-t border-gray-200">
                            <p className="text-gray-600">
                                ¿Ya tienes cuenta?{" "}
                                <button
                                    type="button"
                                    className={`font-medium transition-colors ${userType === "student"
                                        ? "text-blue-600 hover:text-blue-700"
                                        : "text-purple-600 hover:text-purple-700"
                                        }`}
                                >
                                    Inicia sesión
                                </button>
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

export default SignupForm
