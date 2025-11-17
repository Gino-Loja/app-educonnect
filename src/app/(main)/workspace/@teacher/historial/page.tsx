import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconHistory } from "@tabler/icons-react"

export default function HistorialPage() {
  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
          <IconHistory className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Historial</h1>
          <p className="text-muted-foreground">
            Tareas completadas y tu historial de trabajo
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-12">
            <IconHistory className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay trabajos completados</h3>
            <p className="mb-4">Aquí aparecerán todas las tareas que hayas completado</p>
            <Button asChild>
              <Link href="/workspace/marketplace">Explorar Tareas</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
