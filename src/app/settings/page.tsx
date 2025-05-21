import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Configurações | Frigg",
  description: "Gerencie as configurações do sistema Frigg.",
};

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações Gerais</h3>
        <p className="text-sm text-muted-foreground">
          Configure as opções gerais do sistema.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurações gerais serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Aparência</h3>
        <p className="text-sm text-muted-foreground">
          Personalize a aparência e o tema da interface.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Opções de tema e personalização serão adicionadas aqui.
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

function ApiSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de API</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie chaves de API e integrações.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurações de API serão adicionadas aqui.
        </p>
      </div>
    </div>
  );
} 