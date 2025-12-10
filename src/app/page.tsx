'use client';

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

type RoleTab = 'student' | 'teacher';

const EduConnectLanding = () => {
  const [activeTab, setActiveTab] = useState<RoleTab>('student');

  const subjects = [
    { icon: Calculator, name: 'Matemáticas', color: 'bg-blue-100 text-blue-600' },
    { icon: Globe, name: 'Historia', color: 'bg-green-100 text-green-600' },
    { icon: Microscope, name: 'Ciencias', color: 'bg-purple-100 text-purple-600' },
    { icon: PenTool, name: 'Literatura', color: 'bg-pink-100 text-pink-600' },
    { icon: Code, name: 'Programación', color: 'bg-indigo-100 text-indigo-600' },
    { icon: Languages, name: 'Idiomas', color: 'bg-orange-100 text-orange-600' }
  ];

  const heroStats = [
    { value: '25K+', label: 'Estudiantes activos', detail: 'en 32 ciudades' },
    { value: '5K+', label: 'Profesores verificados', detail: '60 especialidades' },
    { value: '4.9/5', label: 'Satisfacción promedio', detail: '3K reseñas' }
  ];

  const tabContent: Record<
    RoleTab,
    {
      title: string;
      description: string;
      bullets: string[];
      highlights: { label: string; value: string; helper: string }[];
    }
  > = {
    student: {
      title: 'Aprende acompañado de expertos en minutos',
      description:
        'Describe tu reto académico, sube archivos de referencia y recibe propuestas claras de profesores verificados antes de 15 minutos.',
      bullets: [
        'Filtros inteligentes por materia, idioma y presupuesto',
        'Seguimiento en tiempo real del progreso de cada tarea',
        'Pagos protegidos y liberados solo cuando apruebas el resultado'
      ],
      highlights: [
        { label: 'Tiempo de respuesta', value: '< 15 min', helper: 'Promedio en horario hábil' },
        { label: 'Casos de éxito', value: '98%', helper: 'Reseñas con 4-5 estrellas' },
        { label: 'Profesores disponibles', value: '5,200+', helper: 'Con certificación' }
      ]
    },
    teacher: {
      title: 'Monetiza tu experiencia guiando estudiantes',
      description:
        'Recibe alertas de tareas compatibles con tu perfil, envía propuestas claras y cobra de forma segura dentro de la plataforma.',
      bullets: [
        'Agenda flexible y tablero con todos tus proyectos',
        'Herramientas de comunicación y envío de entregables',
        'Pagos semanales con comisiones transparentes'
      ],
      highlights: [
        { label: 'Ingresos promedio', value: '$820 usd', helper: 'Por mes activo' },
        { label: 'Tiempo de cobro', value: '72 h', helper: 'Después de la aprobación' },
        { label: 'Tareas nuevas', value: '1,300/día', helper: 'Latinoamérica y España' }
      ]
    }
  };

  const benefits = [
    {
      icon: BookOpen,
      title: 'Acompañamiento contextualizado',
      description: 'Comparte rúbricas, archivos y comentarios para recibir soluciones alineadas a tu forma de trabajo.'
    },
    {
      icon: Users,
      title: 'Profesores verificados',
      description: 'Validamos identidades, títulos y experiencia docente antes de que puedan aceptar tareas.'
    },
    {
      icon: Shield,
      title: 'Pagos protegidos',
      description: 'Tu inversión queda en custodia hasta que confirmas que la entrega cumple con tus expectativas.'
    },
    {
      icon: Clock,
      title: 'Entregas puntuales',
      description: 'Alertas automáticas y recordatorios mantienen a todos sincronizados con la fecha límite.'
    }
  ];

  const workflowSteps = [
    {
      title: 'Describe tu reto',
      description: 'Indica materia, nivel, fecha límite y adjunta ejemplos o rúbricas en menos de 2 minutos.'
    },
    {
      title: 'Elige al profesor ideal',
      description: 'Compara propuestas por precio, experiencia y calificaciones verificadas.'
    },
    {
      title: 'Trabaja con confianza',
      description: 'Chatea, comparte archivos y recibe avances hasta aprobar la entrega final.'
    }
  ];

  const testimonials = [
    {
      quote:
        'EduConnect se volvió parte de mi rutina universitaria. Los profesores explican paso a paso y puedo repasar las sesiones grabadas cuando lo necesito.',
      name: 'Andrea Pineda',
      role: 'Estudiante de Ingeniería',
      highlight: 'Subió su promedio en Cálculo II',
      rating: '5.0'
    },
    {
      quote:
        'Como docente independiente, tener una plataforma que centraliza pagos, contratos y feedback me permite concentrarme en enseñar.',
      name: 'Luis Camacho',
      role: 'Profesor de Programación',
      highlight: '40 tareas completadas',
      rating: '4.9'
    },
    {
      quote:
        'Usamos EduConnect para reforzar inglés avanzado. La combinación de sesiones en vivo y materiales personalizados aceleró el progreso del grupo.',
      name: 'Mariana Ortiz',
      role: 'Coordinadora Académica',
      highlight: 'Equipo de 12 estudiantes',
      rating: '5.0'
    }
  ];

  const FloatingCard = ({
    children,
    className = '',
    delay = 0
  }: {
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
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
          75% {
            transform: translateY(-15px) rotate(0.5deg);
          }
        }
      `}</style>
    </div>
  );

  const StudentCard = ({
    name,
    subject,
    rating,
    className,
    delay
  }: {
    name: string;
    subject: string;
    rating: string;
    className: string;
    delay: number;
  }) => (
    <FloatingCard className={className} delay={delay}>
      <div className="p-4 flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')}
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

  const TaskCard = ({
    title,
    price,
    time,
    className,
    delay
  }: {
    title: string;
    price: string;
    time: string;
    className: string;
    delay: number;
  }) => (
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

  const SubjectIcon = ({
    subject,
    className,
    delay
  }: {
    subject: {
      icon: React.ComponentType<{ className?: string; size?: number }>;
      name: string;
      color: string;
    };
    className: string;
    delay: number;
  }) => (
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
    <div className="relative min-h-screen bg-slate-950/5 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-40 right-0 w-[480px] h-[480px] bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-0 w-[520px] h-[520px] bg-blue-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="relative z-50 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-600 font-semibold">EduConnect</p>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Aprendizaje a tu ritmo</h1>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
              <a href="#beneficios" className="hover:text-gray-900 transition-colors">
                Beneficios
              </a>
              <a href="#flujo" className="hover:text-gray-900 transition-colors">
                ¿Cómo funciona?
              </a>
              <a href="#testimonios" className="hover:text-gray-900 transition-colors">
                Historias
              </a>
              <a href="#materias" className="hover:text-gray-900 transition-colors">
                Materias
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                Ingresa
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center space-x-3 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-blue-700 shadow-sm">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span>Asesorías en vivo y entregables listos para enviar</span>
                </div>

                <div className="space-y-6">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Resuelve tus tareas con el mejor talento académico.
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Más de 5,000 docentes verificados te ayudan a dominar materias complejas, mejorar tu promedio o
                    monetizar tu experiencia guiando a estudiantes que necesitan apoyo puntual.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <Link
                    href="/workspace"
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                  >
                    Publicar tarea
                  </Link>
                  <Link
                    href="/workspace"
                    className="inline-flex items-center space-x-2 text-lg font-semibold text-purple-700 hover:text-purple-800"
                  >
                    <span>Quiero enseñar</span>
                    <ArrowRight size={18} />
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Shield size={16} className="text-green-500" />
                    <span>Pagos protegidos por EduConnect</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white/70 p-5 backdrop-blur">
                      <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative lg:h-[420px]">
                <StudentCard name="María González" subject="Matemáticas · Universitaria" rating="4.9" className="w-64 top-4 right-20" delay={0} />
                <StudentCard name="Carlos Mendoza" subject="Programación · Experto" rating="5.0" className="w-64 top-20 right-0" delay={1.5} />
                <StudentCard name="Ana Rodríguez" subject="Literatura · Doctora" rating="4.8" className="w-64 top-44 right-32" delay={3} />

                <TaskCard title="Ensayo de filosofía moderna" price="85" time="3 días" className="w-56 top-6 left-6" delay={0.5} />
                <TaskCard title="Ejercicios de cálculo integral" price="120" time="2 días" className="w-56 top-32 left-0" delay={2} />
                <TaskCard title="Proyecto de React.js" price="200" time="1 semana" className="w-56 top-60 left-10" delay={4} />

                <SubjectIcon subject={subjects[0]} className="w-16 top-0 left-36" delay={1} />
                <SubjectIcon subject={subjects[1]} className="w-16 top-16 left-52" delay={2.5} />
                <SubjectIcon subject={subjects[2]} className="w-16 top-40 left-24" delay={4.5} />
                <SubjectIcon subject={subjects[3]} className="w-16 top-64 left-48" delay={3.5} />

                <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-0 -left-6 w-28 h-28 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl opacity-70" />
              </div>
            </div>
          </section>

          <section className="relative z-20 -mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-white shadow-2xl shadow-blue-600/10 border border-gray-100 p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                      Adaptado a tus metas
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">¿Eres estudiante o profesor?</h3>
                    <p className="text-gray-600 mt-3 max-w-2xl">
                      Cambia de modo para ver los beneficios y herramientas que prepararmos para cada rol dentro de EduConnect.
                    </p>
                  </div>
                  <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
                    {(['student', 'teacher'] as RoleTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                          activeTab === tab ? 'bg-white text-gray-900 shadow' : 'text-gray-500'
                        }`}
                      >
                        {tab === 'student' ? 'Modo estudiante' : 'Modo profesor'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
                  <div className="space-y-6">
                    <h4 className="text-2xl font-semibold text-gray-900">{tabContent[activeTab].title}</h4>
                    <p className="text-gray-600">{tabContent[activeTab].description}</p>
                    <ul className="space-y-3">
                      {tabContent[activeTab].bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start space-x-3">
                          <CheckCircle size={18} className="text-blue-600 mt-1" />
                          <span className="text-gray-700">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {tabContent[activeTab].highlights.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-center">
                        <p className="text-sm font-medium text-gray-500">{item.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{item.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.helper}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="beneficios" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.3em]">BENEFICIOS</p>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">Diseñado para acompañarte en cada etapa</h3>
                <p className="text-gray-600 mt-4">
                  Centraliza la comunicación, los archivos y los pagos sin salir de EduConnect. Así puedes enfocarte en aprender o enseñar.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm hover:shadow-xl transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center mb-4">
                      <benefit.icon size={22} />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-600 mt-3">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="flujo" className="bg-white py-20 border-y border-gray-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
                <div>
                  <p className="text-sm font-semibold text-purple-600 uppercase tracking-[0.3em]">FLUJO DE TRABAJO</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-4">Comienza en minutos y dale seguimiento desde tu dashboard</h3>
                </div>
                <Link href="/workspace" className="inline-flex items-center text-purple-600 font-semibold">
                  Ver demo
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="flex flex-col">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-semibold">
                        {index + 1}
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900">{step.title}</h4>
                    </div>
                    <p className="text-gray-600 mt-4 leading-relaxed">{step.description}</p>
                    {index < workflowSteps.length - 1 && (
                      <div className="mt-6 hidden md:block h-px bg-gradient-to-r from-purple-200 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="testimonios" className="py-20 bg-slate-950 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
                <div>
                  <p className="text-sm font-semibold text-blue-300 uppercase tracking-[0.3em]">TESTIMONIOS</p>
                  <h3 className="text-3xl font-bold mt-4">Personas reales, resultados reales</h3>
                  <p className="text-slate-300 mt-3 max-w-2xl">
                    Creamos experiencias de aprendizaje personalizadas para estudiantes, docentes y organizaciones educativas.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <Star className="text-yellow-300 fill-yellow-300" size={16} />
                  <span>Calificación promedio 4.9/5</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.name} className="rounded-3xl bg-white/5 p-6 border border-white/10 backdrop-blur">
                    <p className="text-lg leading-relaxed text-slate-100">“{testimonial.quote}”</p>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-300">{testimonial.role}</p>
                      <p className="text-xs text-blue-200 mt-2">{testimonial.highlight}</p>
                      <div className="mt-3 inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        <Star className="text-yellow-300 fill-yellow-300" size={14} />
                        <span>{testimonial.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="materias" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-[0.3em]">MATERIAS</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-4">Elige especialistas en cualquier área</h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-3">
                  Cobertura total desde educación básica hasta posgrado, con profesores disponibles en tu zona horaria.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {subjects.map((subject) => (
                  <div
                    key={subject.name}
                    className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all"
                  >
                    <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 ${subject.color}`}>
                      <subject.icon size={28} />
                    </div>
                    <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-10 flex flex-col lg:flex-row items-center lg:justify-between gap-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-white/60">LISTO PARA EMPEZAR</p>
                  <h3 className="text-3xl font-bold mt-4">
                    Publica tu primera tarea o actívate como profesor en menos de 5 minutos.
                  </h3>
                  <p className="text-white/80 mt-3">
                    Accede a un panel intuitivo, soporte prioritario y herramientas diseñadas para generar confianza entre estudiantes y docentes.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-blue-700 font-semibold shadow-lg shadow-blue-900/30"
                  >
                    Crear cuenta
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 font-semibold text-white"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default EduConnectLanding;
