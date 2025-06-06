import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Configurações | Frigg",
  description: "Gerencie as configurações do sistema Frigg.",
};

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Configurações Gerais</h3>
        <p className="text-sm text-muted-foreground">
          Configure as opções gerais do sistema.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Configurações gerais serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
}

function DatabaseSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações do Banco de Dados</h3>
        <p className="text-sm text-muted-foreground">
          Gerenciar configurações do banco de dados Neo4j.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurações de conexão com Neo4j serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
} 