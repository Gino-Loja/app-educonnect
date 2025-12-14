import Link from "next/link"

type ConfigNavigationProps = {
  role: "student" | "teacher"
  active: "cuenta" | "finanzas" | "banco"
}

const baseTabs = [
  { key: "cuenta" as const, label: "Cuenta", href: "/workspace/configuracion/cuenta" },
  { key: "finanzas" as const, label: "Parametros financieros", href: "/workspace/configuracion/finanzas" },
  { key: "banco" as const, label: "Cuenta bancaria", href: "/workspace/configuracion/cuenta-bancaria" },
]

export function ConfigNavigation({ role, active }: ConfigNavigationProps) {
  const tabs = baseTabs.filter((tab) => role === "teacher" || tab.key === "cuenta")

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isActive ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
