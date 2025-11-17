import { getDashboardStats, getRecentActivity } from "@/lib/data/admin-actions"
import { StatsCards } from "@/components/admin/StatsCards"
import { RecentActivity } from "@/components/admin/RecentActivity"

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  const activity = await getRecentActivity()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de la plataforma EduTask
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Activity */}
      <RecentActivity activity={activity} />
    </div>
  )
}
