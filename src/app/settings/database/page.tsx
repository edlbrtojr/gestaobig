import { Separator } from "@/components/ui/separator";

export default function DatabaseSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Configurações do Banco de Dados</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações de conexão com o Neo4j.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Configurações de conexão com Neo4j serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
} 