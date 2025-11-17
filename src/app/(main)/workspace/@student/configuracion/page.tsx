export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground">Ajusta las preferencias de tu cuenta</p>
      </div>

      {/* Contenido de configuración aquí */}
      <div className="rounded-lg border p-8">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Notificaciones</h3>
            <p className="text-sm text-muted-foreground">Gestiona cómo recibes notificaciones</p>
          </div>
          <div>
            <h3 className="font-medium">Privacidad</h3>
            <p className="text-sm text-muted-foreground">Controla quién puede ver tu información</p>
          </div>
          <div>
            <h3 className="font-medium">Cuenta</h3>
            <p className="text-sm text-muted-foreground">Administra tu cuenta y seguridad</p>
          </div>
        </div>
      </div>
    </div>
  )
}
