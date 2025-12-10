import { requireAdmin } from "@/lib/auth/admin"
import { listCatalog } from "@/lib/data/admin-academic-actions"
import { AcademicCatalogManager } from "@/components/admin/AcademicCatalogManager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default async function AdminAcademicSettingsPage() {
  await requireAdmin()

  const [subjects, levels] = await Promise.all([listCatalog("subject"), listCatalog("level")])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Academico</h3>
        <p className="text-sm text-muted-foreground">
          Administra la configuracion academica de la plataforma.
        </p>
      </div>
      <Separator />

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Catalogos academicos</CardTitle>
          <p className="text-sm text-muted-foreground">Gestiona materias y niveles academicos que se usan en la plataforma.</p>
        </CardHeader>
        <CardContent>
          <AcademicCatalogManager subjects={subjects} levels={levels} />
        </CardContent>
      </Card>
    </div>
  )
}
