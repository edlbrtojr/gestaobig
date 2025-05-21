import { Separator } from "@/components/ui/separator";
import AdminConfigForm from "./admin-config-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de Administrador</h3>
        <p className="text-sm text-muted-foreground">
          Configure o esquema do grafo e as regras de negócio do sistema.
        </p>
      </div>
      
      <Separator />
      
      <AdminConfigForm />
    </div>
  );
} 