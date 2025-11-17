import type { DashboardStats } from "@/lib/data/admin-actions"
import {
  IconUsers,
  IconClipboardList,
  IconCreditCard,
  IconAlertTriangle,
  IconUserPlus,
  IconFileCheck,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      description: `${stats.totalStudents} estudiantes, ${stats.totalTeachers} profesores`,
      icon: IconUsers,
      color: "text-blue-600",
    },
    {
      title: "Nuevos Este Mes",
      value: stats.newUsersThisMonth,
      description: "Registros en el mes actual",
      icon: IconUserPlus,
      color: "text-green-600",
    },
    {
      title: "Total Tareas",
      value: stats.totalTasks,
      description: `${stats.openTasks} abiertas, ${stats.inProgressTasks} en progreso`,
      icon: IconClipboardList,
      color: "text-purple-600",
    },
    {
      title: "Tareas Completadas",
      value: stats.completedTasks,
      description: `${stats.totalProposals} propuestas totales`,
      icon: IconFileCheck,
      color: "text-emerald-600",
    },
    {
      title: "Transacciones",
      value: stats.totalTransactions,
      description: `$${stats.totalRevenue.toFixed(2)} en ingresos`,
      icon: IconCreditCard,
      color: "text-amber-600",
    },
    {
      title: "Disputas Pendientes",
      value: stats.pendingDisputes,
      description: "Requieren atención",
      icon: IconAlertTriangle,
      color: stats.pendingDisputes > 0 ? "text-red-600" : "text-gray-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
