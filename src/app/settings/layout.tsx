import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SideNavItem } from "../../components/side-nav-item";

export const metadata: Metadata = {
  title: "Configurações | Frigg",
  description: "Gerencie as configurações do sistema Frigg.",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container max-w-screen-xl mx-auto py-6 space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e do sistema.
        </p>
      </div>
      
      <Separator />
      
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        <aside className="md:w-1/5">
          <nav className="space-y-2">
            <SideNavItem href="/settings" exact>
              Geral
            </SideNavItem>
            <SideNavItem href="/settings/appearance">
              Aparência
            </SideNavItem>
            <SideNavItem href="/settings/aplicativo">
              Aplicativo
            </SideNavItem>
            <SideNavItem href="/settings/database">
              Banco de Dados
            </SideNavItem>
            <SideNavItem href="/settings/api">
              API
            </SideNavItem>
            <SideNavItem href="/settings/admin">
              Admin
            </SideNavItem>
          </nav>
        </aside>
        <div className="flex-1 md:max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
} 