import { getUsers } from "@/lib/data/admin-user-actions"
import { UsersTable } from "@/components/admin/UsersTable"
import { UsersFilters } from "@/components/admin/UsersFilters"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const role = (params.role as string) || "all"
  const status = (params.status as "active" | "inactive" | "all") || "all"
  const search = (params.search as string) || ""

  const result = await getUsers({
    page,
    limit: 20,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra todos los usuarios de la plataforma
        </p>
      </div>

      <UsersFilters defaultRole={role} defaultStatus={status} defaultSearch={search} />
      <UsersTable users={result.users} pagination={result} />
    </div>
  )
}
