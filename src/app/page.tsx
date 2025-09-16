
'use client'
import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Calculator,
  Globe,
  Microscope,
  PenTool,
  Code,
  Languages
} from 'lucide-react';
import Link from 'next/link';

const EduConnectLanding = () => {
  const [activeTab, setActiveTab] = useState('student');

  // Sujetos de estudio con iconos
  const subjects = [
    { icon: Calculator, name: 'Matemáticas', color: 'bg-blue-100 text-blue-600' },
    { icon: Globe, name: 'Historia', color: 'bg-green-100 text-green-600' },
    { icon: Microscope, name: 'Ciencias', color: 'bg-purple-100 text-purple-600' },
    { icon: PenTool, name: 'Literatura', color: 'bg-pink-100 text-pink-600' },
    { icon: Code, name: 'Programación', color: 'bg-indigo-100 text-indigo-600' },
    { icon: Languages, name: 'Idiomas', color: 'bg-orange-100 text-orange-600' }
  ];

  const FloatingCard = ({ children, className = "", delay = 0 }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
  }) => (
    <div
      className={`absolute rounded-2xl shadow-lg bg-white border border-gray-100 ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      {children}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          75% { transform: translateY(-15px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );

  const StudentCard = ({ name, subject, rating, className, delay }

    : {
      name: string;
      subject: string;
      rating: string;
      className: string;
      delay: number;
    }
  ) => (
    <FloatingCard className={className} delay={delay}>
      <div className="p-4 flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{subject}</p>
          <div className="flex items-center space-x-1">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700">{rating}</span>
          </div>
        </div>
      </div>
    </FloatingCard>
  );

  const TaskCard = ({ title, price, time, className, delay }:
    {
      title: string;
      price: string;
      time: string;
      className: string;
      delay: number;
    }
  ) => (
    <FloatingCard className={className} delay={delay}>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600 font-semibold">${price}</span>
          <span className="text-gray-500">{time}</span>
        </div>
        <div className="mt-2 flex items-center text-xs text-blue-600">
          <Clock size={12} className="mr-1" />
          <span>3 propuestas</span>
        </div>
      </div>
    </FloatingCard>
  );

  const SubjectIcon = ({ subject, className, delay }:
    {
      subject: {
        icon: any;
        name: string;
        color: string;
      };
      className: string;
      delay: number;
    }
  ) => (
    <FloatingCard className={className} delay={delay}>
      <div className="p-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${subject.color}`}>
          <subject.icon size={20} />
        </div>
        <p className="text-xs font-medium text-gray-700 mt-2 text-center">{subject.name}</p>
      </div>
    </FloatingCard>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="relative z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">EduConnect</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('student')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'student'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Necesito ayuda
                  {activeTab === 'student' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('teacher')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'teacher'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Quiero enseñar
                  {activeTab === 'teacher' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                  )}
                </button>
              </div>
            </nav>

            {/* Auth Buttons */}

            <div className="flex items-center space-x-4">
              {/* Link to Login */}
              <Link href="/login">
                <button className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                  Ingresa
                </button>
              </Link>


              {/* Link to Signup */}

              <Link href="/signup">
                <button className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/25">
                  Regístrate
                </button>
              </Link>

            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div className="space-y-8">
              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Ayuda garantizada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield size={16} className="text-blue-500" />
                  <span>Profesores verificados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-purple-500" />
                  <span>Respuesta rápida</span>
                </div>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Resuelve tus tareas con el
                </h1>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  mejor talento académico
                </h1>

              </div>

              {/* Subtitle */}
              <div className="space-y-3 text-lg text-gray-600 max-w-lg">
                <p>
                  Conecta con profesores expertos en cualquier materia.
                </p>
                <p>
                  Te ayudamos con miles de especialistas verificados
                  en tu idioma y zona horaria.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center space-x-6">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
                  Publicar tarea
                </button>
                <button className="flex items-center space-x-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition-colors">
                  <span>¿Quieres trabajar?</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* Right Visual Area */}
            <div className="relative lg:h-96">
              {/* Student Cards */}
              <StudentCard
                name="María González"
                subject="Matemáticas • Universitaria"
                rating="4.9"
                className="w-64 top-4 right-20"
                delay={0}
              />

              <StudentCard
                name="Carlos Mendoza"
                subject="Programación • Experto"
                rating="5.0"
                className="w-64 top-24 right-0"
                delay={1.5}
              />

              <StudentCard
                name="Ana Rodríguez"
                subject="Literatura • Doctora"
                rating="4.8"
                className="w-64 top-44 right-32"
                delay={3}
              />

              {/* Task Cards */}
              <TaskCard
                title="Ensayo de filosofía moderna"
                price="85"
                time="3 días"
                className="w-56 top-8 left-4"
                delay={0.5}
              />

              <TaskCard
                title="Ejercicios de cálculo integral"
                price="120"
                time="2 días"
                className="w-56 top-32 left-0"
                delay={2}
              />

              <TaskCard
                title="Proyecto de React.js"
                price="200"
                time="1 semana"
                className="w-56 top-56 left-8"
                delay={4}
              />

              {/* Subject Icons */}
              <SubjectIcon
                subject={subjects[0]}
                className="w-16 top-0 left-32"
                delay={1}
              />

              <SubjectIcon
                subject={subjects[1]}
                className="w-16 top-16 left-48"
                delay={2.5}
              />

              <SubjectIcon
                subject={subjects[2]}
                className="w-16 top-40 left-24"
                delay={4.5}
              />

              <SubjectIcon
                subject={subjects[3]}
                className="w-16 top-64 left-44"
                delay={3.5}
              />

              {/* Background Decorative Elements */}
              <div className="absolute top-12 left-12 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute top-40 right-8 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 blur-lg"></div>
              <div className="absolute bottom-8 left-20 w-20 h-20 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-25 blur-lg"></div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">25K+</div>
                <div className="text-gray-600">Estudiantes activos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">5K+</div>
                <div className="text-gray-600">Profesores expertos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">100K+</div>
                <div className="text-gray-600">Tareas completadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">4.9★</div>
                <div className="text-gray-600">Satisfacción promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Encuentra ayuda en cualquier materia
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Nuestros profesores cubren todas las áreas académicas,
                desde educación básica hasta posgrado
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {subjects.map((subject, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 ${subject.color}`}>
                    <subject.icon size={28} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EduConnectLanding;