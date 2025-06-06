"use client";

import { Separator } from "@/components/ui/separator";
import OrganizationSettingsForm from "./organization-settings-form";

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Central de Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Personalize a identidade visual, aparência, e conteúdo estratégico da sua aplicação.
        </p>
      </div>
      
      <Separator />
      
      <OrganizationSettingsForm />
    </div>
  );
} 