"use client"

import { useMemo, useState, useTransition } from "react"
import { addCatalogEntry, deleteCatalogEntry, toggleCatalogEntry, type CatalogEntry, type CatalogType } from "@/lib/data/admin-academic-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

type AcademicCatalogManagerProps = {
  subjects: CatalogEntry[]
  levels: CatalogEntry[]
}

type AddFormState = {
  label: string
  order?: string
}

function Section({
  title,
  type,
  items,
}: {
  title: string
  type: CatalogType
  items: CatalogEntry[]
}) {
  const [form, setForm] = useState<AddFormState>({ label: "", order: "" })
  const [list, setList] = useState(items)
  const [isPending, startTransition] = useTransition()

  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        const aOrder = a.order_index ?? Number.MAX_SAFE_INTEGER
        const bOrder = b.order_index ?? Number.MAX_SAFE_INTEGER
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.label.localeCompare(b.label)
      }),
    [list],
  )

  const handleAdd = () => {
    startTransition(async () => {
      const orderIndex = form.order ? Number(form.order) : undefined
      const result = await addCatalogEntry(type, form.label, Number.isNaN(orderIndex) ? undefined : orderIndex)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      toast.success("Guardado")
      setForm({ label: "", order: "" })
      // optimistic append
      setList((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type,
          label: form.label.trim(),
          order_index: Number.isNaN(orderIndex) ? null : orderIndex ?? null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    })
  }

  const handleToggle = (id: string, next: boolean) => {
    startTransition(async () => {
      const result = await toggleCatalogEntry(id, next)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      setList((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: next } : item)))
      toast.success("Actualizado")
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCatalogEntry(id)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      setList((prev) => prev.filter((item) => item.id !== id))
      toast.success("Eliminado")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_160px_auto]">
          <div className="space-y-1.5">
            <Label>Nuevo valor</Label>
            <Input
              placeholder="Ej. Matematicas"
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Orden (opcional)</Label>
            <Input
              placeholder="Ej. 1"
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
              disabled={isPending}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isPending || !form.label.trim()}
            className="w-full sm:col-span-2 xl:col-span-1 xl:w-auto"
          >
            {isPending ? "Guardando..." : "Agregar"}
          </Button>
        </div>
      </div>

      <div className="divide-y rounded-lg border border-slate-200">
        {sorted.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Sin valores registrados.</div>
        ) : (
          sorted.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  Orden: {item.order_index ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(next) => handleToggle(item.id, next)}
                  disabled={isPending}
                />
                <span className="text-xs text-muted-foreground">{item.is_active ? "Activo" : "Inactivo"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-red-500 hover:text-red-600"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function AcademicCatalogManager({ subjects, levels }: AcademicCatalogManagerProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconCheck className="h-4 w-4 text-emerald-600" />
          <h3 className="text-base font-semibold">Materias</h3>
        </div>
        <Section title="Materias" type="subject" items={subjects} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconX className="h-4 w-4 text-blue-600 rotate-45" />
          <h3 className="text-base font-semibold">Niveles academicos</h3>
        </div>
        <Section title="Niveles academicos" type="level" items={levels} />
      </div>
    </div>
  )
}
