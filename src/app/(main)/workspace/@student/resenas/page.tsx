export default function ResenasPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Reseñas</h1>
        <p className="text-muted-foreground">Tus valoraciones y comentarios</p>
      </div>

      {/* Contenido de reseñas aquí */}
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No has dejado reseñas aún</p>
      </div>
    </div>
  )
}
