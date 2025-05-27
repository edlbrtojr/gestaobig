"use client";

import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SideNavItem } from "../../components/side-nav-item";
import { useAuth } from "@/contexts/auth-context";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerencie as configurações da sua conta e do sistema.",
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes('admin');
  
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
            <SideNavItem href="/settings/organization">
              Organização
            </SideNavItem>
            <SideNavItem href="/settings/aplicativo">
              Aplicativo
            </SideNavItem>
            <SideNavItem href="/settings/database">
              Banco de Dados
            </SideNavItem>
            
            {/* Only show admin options to admin users */}
            {isAdmin && (
              <>
                <div className="pt-4 mt-4 border-t border-border">
                  <h3 className="mb-2 font-medium text-muted-foreground">Administração</h3>
                  <div className="space-y-2">
                    <SideNavItem href="/settings/admin">
                      Admin
                    </SideNavItem>
                    <SideNavItem href="/settings/admin/node-permissions">
                      Visibilidade de Nós
                    </SideNavItem>
                  </div>
                </div>
              </>
            )}
          </nav>
        </aside>
        <div className="flex-1 md:max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
} 