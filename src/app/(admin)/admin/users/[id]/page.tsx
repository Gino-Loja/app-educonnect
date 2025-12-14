import Link from "next/link"
import { notFound } from "next/navigation"
import { getUserById } from "@/lib/data/admin-user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconCalendar,
  IconMail,
  IconPhone,
  IconSchool,
  IconUser,
  IconBriefcase,
  IconCoins,
} from "@tabler/icons-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

type Props = {
  params: Promise<{ id: string }>
}

const ROLE_LABELS: Record<string, string> = {
  student: "Estudiante",
  teacher: "Profesor",
  admin: "Administrador",
}

const formatDate = (date: string | null | undefined) =>
  date ? format(new Date(date), "dd/MM/yyyy") : "Sin dato"

const formatRelative = (date: string | null | undefined) =>
  date
    ? formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: es,
      })
    : "Sin actividad"

const formatList = (values: string[] | null | undefined) =>
  values && values.length > 0 ? values.join(", ") : "Sin dato"

const formatMoney = (value: number | null | undefined) =>
  value === null || value === undefined ? "Sin dato" : `$${value.toFixed(2)}`

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getUserById(id)

  if (result.status === "error" || !result.user) {
    notFound()
  }

  const user = result.user
  const roleLabel = ROLE_LABELS[user.role] || user.role
  const student = user.student
  const teacher = user.teacher
  const teacherBank = user.teacher_bank_account

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconUser className="h-4 w-4" />
            <span>ID {user.id}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name || "Usuario sin nombre"}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{user.email}</Badge>
            <Badge variant="secondary">{roleLabel}</Badge>
            <Badge variant={user.is_active ? "default" : "secondary"}>
              {user.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Volver a usuarios
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rol</span>
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registrado</span>
              <span className="font-medium">{formatDate(user.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ultima actividad</span>
              <span className="font-medium">{formatRelative(user.last_active_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconPhone className="h-4 w-4" />
                <span>Telefono</span>
              </div>
              <span className="font-medium">{user.phone || "Sin numero"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconCalendar className="h-4 w-4" />
                <span>Registro</span>
              </div>
              <span className="font-medium">{formatRelative(user.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{user.name || "Sin nombre"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Activo</span>
              <span className="font-medium">{user.is_active ? "Si" : "No"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Avatar</span>
              <span className="font-medium">
                {user.profile_picture_url ? "Carga disponible" : "Sin foto"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {student && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconSchool className="h-5 w-5" />
              Perfil de estudiante
            </CardTitle>
            <Badge variant="outline">Academico</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Nivel academico</p>
              <p className="font-medium">{student.academic_level || "Sin dato"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Carrera / especialidad</p>
              <p className="font-medium">{student.major || "Sin dato"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Presupuesto preferido</p>
              <p className="font-medium">{student.budget_range || "Sin dato"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Temas de interes</p>
              <p className="font-medium">{formatList(student.subjects_of_interest)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Tareas creadas</p>
              <p className="font-medium">{student.total_tasks_created ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total gastado</p>
              <p className="font-medium">{formatMoney(student.total_spent)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {teacher && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconBriefcase className="h-5 w-5" />
              Perfil de profesor
            </CardTitle>
            <Badge variant="outline">Docente</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Tarifa por hora</p>
              <p className="font-medium">{formatMoney(teacher.hourly_rate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Especialidades</p>
              <p className="font-medium">{formatList(teacher.specialties)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Asignaturas</p>
              <p className="font-medium">{formatList(teacher.subjects)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Disponible</p>
              <p className="font-medium">{teacher.is_available ? "Si" : "No"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Experiencia</p>
              <p className="font-medium">
                {teacher.teaching_experience_years !== null && teacher.teaching_experience_years !== undefined
                  ? `${teacher.teaching_experience_years} anos`
                  : "Sin dato"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Ingresos totales</p>
              <p className="font-medium">{formatMoney(teacher.total_earnings)}</p>
            </div>
            <div className="md:col-span-3 space-y-2 rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold">Cuenta bancaria</p>
              {teacherBank ? (
                <div className="grid gap-2 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Banco</p>
                    <p className="font-medium">{teacherBank.bank_name || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Titular</p>
                    <p className="font-medium">{teacherBank.account_holder || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cuenta</p>
                    <p className="font-medium">{teacherBank.account_number || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Alias</p>
                    <p className="font-medium">{teacherBank.account_alias || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{teacherBank.account_type || "Sin dato"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pais / Moneda</p>
                    <p className="font-medium">
                      {(teacherBank.country || "Sin dato") +
                        (teacherBank.currency ? ` • ${teacherBank.currency}` : "")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos bancarios registrados.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!student && !teacher && (
        <Card>
          <CardHeader>
            <CardTitle>Datos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconCoins className="h-4 w-4" />
            <span>Este usuario no tiene informacion de rol asociada.</span>
          </CardContent>
        </Card>
      )}

      <Separator />
    </div>
  )
}
