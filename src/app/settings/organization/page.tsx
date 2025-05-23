import { Separator } from "@/components/ui/separator";
import OrganizationSettingsForm from "./organization-settings-form";

export const metadata = {
  title: 'Central de Configurações | Console Administrativo',
  description: 'Configure e personalize a aparência e o comportamento da sua aplicação',
};

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
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