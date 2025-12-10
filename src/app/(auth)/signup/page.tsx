'use client'
import React, { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  User,
  ChevronDown,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupSelection() {
  const [selectedLanguage] = useState('español');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const handleCardClick = (userType: string) => {
    // Aquí iría la lógica para redirigir al registro específico
    router.push(`/signup/${userType}`);
  };

  const UserTypeCard = ({
    type,
    title,
    description,
    icon: Icon,
    bgColor,
    textColor
  }: {
    type: string;
    title: string;
    description: string;
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
  }) => (
    <div
      className={`bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${hoveredCard === type ? 'scale-100' : 'scale-100'
        }`}
      onClick={() => handleCardClick(type)}
      onMouseEnter={() => setHoveredCard(type)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {/* Avatar con decoración */}
      <div className="relative mb-6 flex justify-center">
        <div className="relative">
          {/* <img
            src="/api/placeholder/80/80"
            alt={title}
            className="w-20 h-20 rounded-full object-cover shadow-lg"
          /> */}
          <Icon className="w-16 h-16 text-gray-700" />
          {/* Decorative pattern */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full opacity-70"></div>
          <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-purple-100 rounded-full opacity-60"></div>
          <div className="absolute top-3 -left-3 w-3 h-3 bg-green-100 rounded-full opacity-50"></div>

          {/* Pattern lines */}
          <svg className="absolute -top-4 -right-4 w-12 h-12 opacity-30" viewBox="0 0 24 24">
            <g stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-300">
              <line x1="3" y1="3" x2="9" y2="3" />
              <line x1="3" y1="7" x2="7" y2="7" />
              <line x1="3" y1="11" x2="5" y2="11" />
            </g>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className={`text-2xl font-bold mb-3 ${textColor}`}>
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      <div
        className={`mt-6 transform transition-all duration-300 
    ${hoveredCard === type ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <div className={`w-full py-3 ${bgColor} text-white rounded-lg font-semibold text-center`}>
          Continuar como {title}
        </div>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduConnect</h1>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Globe size={16} className="text-gray-500" />
              <span className="text-gray-700 font-medium">{selectedLanguage}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Back Button */}

        <Link href="/">
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-8 group transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
        </Link>


        {/* Main Title */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            ¡Hola! ¿Qué te trae a EduConnect?
          </h1>
        </div>

        {/* "Quiero contratar" Section */}
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">

          <div className="flex flex-col justify-center ">
            <h2 className="text-xl font-semibold text-gray-700 mb-8 text-center">
              Necesito ayuda académica
            </h2>
            <UserTypeCard
              type="learner"
              title="ESTUDIANTE"
              description="Obtén ayuda personalizada de profesores expertos para resolver tus tareas y proyectos."
              icon={BookOpen}
              bgColor="bg-blue-600"
              textColor="text-blue-600"
            />

          </div>
          <div className="flex flex-col justify-center ">
            <h2 className="text-xl font-semibold text-gray-700 mb-8 text-center">
              Quiero enseñar como
            </h2>

            <UserTypeCard
              type="teacher"
              title="PROFESOR"
              description="Comparte tu conocimiento ayudando estudiantes con tareas específicas en tu área de especialidad."
              icon={GraduationCap}
              bgColor="bg-purple-600"
              textColor="text-purple-600"
            />
          </div>
        </div>

        {/* "Quiero trabajar como" Section */}


        {/* Login Link */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Ingresa aquí
            </button>
          </p>
        </div>
      </main>

      {/* Additional Features */}
      <section className="bg-white py-16 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir EduConnect?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Profesores Verificados</h3>
              <p className="text-gray-600 text-sm">
                Todos nuestros educadores son verificados y evaluados por la comunidad
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Todas las Materias</h3>
              <p className="text-gray-600 text-sm">
                Desde matemáticas básicas hasta tesis de posgrado, cubrimos todo
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Apoyo 24/7</h3>
              <p className="text-gray-600 text-sm">
                Encuentra ayuda cuando la necesites, en tu zona horaria
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};




