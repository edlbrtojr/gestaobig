"use client";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SideNavItem } from "../../components/side-nav-item";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container max-w-screen-xl mx-auto py-4 space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e do sistema.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <aside className="md:w-1/6">
          <nav className="space-y-1.5">
            <SideNavItem href="/settings" exact>
              Geral
            </SideNavItem>
            <SideNavItem href="/settings/organization">Organização</SideNavItem>
            <SideNavItem href="/settings/aplicativo">Aplicativo</SideNavItem>
            <SideNavItem href="/settings/database">Banco de Dados</SideNavItem>

            {/* Users section visible to everyone */}
            <div className="pt-3 mt-3 border-t border-border">
              <h3 className="mb-1.5 font-medium text-muted-foreground">
                Usuários
              </h3>
              <div className="space-y-1.5">
                <SideNavItem href="/settings/users">
                  Gerenciar Usuários
                </SideNavItem>
                <SideNavItem href="/settings/roles">
                  Papéis e Permissões
                </SideNavItem>
              </div>
            </div>

            {/* Admin options now visible to everyone */}
            <div className="pt-3 mt-3 border-t border-border">
              <h3 className="mb-1.5 font-medium text-muted-foreground">
                Administração
              </h3>
              <div className="space-y-1.5">
                <SideNavItem href="/settings/admin">
                  Tipos e Modelos
                </SideNavItem>
                <SideNavItem href="/settings/admin/node-permissions">
                  Permissões
                </SideNavItem>
              </div>
            </div>
          </nav>
        </aside>
        <div className="flex-1 md:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
