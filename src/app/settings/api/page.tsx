import { Separator } from "@/components/ui/separator";

export default function ApiSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Configurações de API</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie chaves de API e integrações.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Configurações de API serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
} 