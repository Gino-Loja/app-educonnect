import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconStar } from "@tabler/icons-react"

export default function ResenasPage() {
  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <IconStar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Reseñas</h1>
            <p className="text-muted-foreground">
              Valoraciones y comentarios de tus estudiantes
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">-</div>
          <div className="text-sm text-muted-foreground">Calificación promedio</div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-12">
            <IconStar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay reseñas todavía</h3>
            <p className="mb-4">Las reseñas de tus estudiantes aparecerán aquí cuando completes trabajos</p>
            <Button asChild>
              <Link href="/workspace/marketplace">Buscar Tareas</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
