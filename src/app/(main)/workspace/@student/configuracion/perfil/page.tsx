import { SettingsPage } from "@/modules/settings/settings-page"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Perfil</h3>
                <p className="text-sm text-muted-foreground">
                    Configura tus preferencias académicas.
                </p>
            </div>
            <Separator />
            <SettingsPage />
        </div>
    )
}
