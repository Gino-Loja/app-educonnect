import { CreateTaskForm } from "@/components/forms/CreateTaskForm"

export default function NuevaTareaPage() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva Tarea</h1>
        <p className="text-muted-foreground">
          Crea una nueva tarea para recibir ayuda de nuestros profesores
        </p>
      </div>

      <CreateTaskForm />
    </div>
  )
}
