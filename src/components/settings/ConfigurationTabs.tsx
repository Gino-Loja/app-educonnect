"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ConfigurationTabsProps {
    accountContent: React.ReactNode
    profileContent: React.ReactNode
    defaultTab?: string
}

export function ConfigurationTabs({
    accountContent,
    profileContent,
    defaultTab = "account",
}: ConfigurationTabsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                <p className="text-muted-foreground">
                    Administra la configuración académica y de cuenta de la plataforma.
                </p>
            </div>
            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="account">Cuenta</TabsTrigger>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="space-y-6">
                    {accountContent}
                </TabsContent>
                <TabsContent value="profile" className="space-y-6">
                    {profileContent}
                </TabsContent>
            </Tabs>
        </div>
    )
}
