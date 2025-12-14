import { Separator } from "@/components/ui/separator"
import { ConfigurationNav } from "@/components/settings/ConfigurationNav"

const sidebarNavItems = [
    {
        title: "Parametros Financieros",
        href: "/admin/settings",
    },
    {
        title: "Academico",
        href: "/admin/settings/academico",
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function AdminSettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Configuracion</h2>
                <p className="text-muted-foreground">
                    Administra la configuracion de la plataforma.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <ConfigurationNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-4xl">{children}</div>
            </div>
        </div>
    )
}
