"use client";

import { Separator } from "@/components/ui/separator";
import AplicativoForm from "./aplicativo-form";

export default function AplicativoSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Configurações do Aplicativo</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações relacionadas ao aplicativo e integrações.
        </p>
      </div>
      
      <Separator />
      
      <AplicativoForm />
    </div>
  );
} 