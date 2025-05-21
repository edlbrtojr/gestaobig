"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function AplicativoForm() {
  const [microsoftFormData, setMicrosoftFormData] = useState({
    clientId: "",
    tenantId: "",
    clientSecret: "",
    redirectUri: "",
    enableSso: false
  });

  const [generalSettings, setGeneralSettings] = useState({
    enableDebugMode: false,
    enableAnalytics: true,
    applicationName: "Frigg",
    maxSessionDuration: "24"
  });

  const handleMicrosoftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setMicrosoftFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setMicrosoftFormData(prev => ({ ...prev, enableSso: checked }));
  };

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setGeneralSettings(prev => ({ ...prev, [id]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data submitted:", { microsoftFormData, generalSettings });
    // Here you would typically save the settings
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="microsoft">Microsoft Entra ID</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="applicationName">Nome do Aplicativo</Label>
              <Input
                id="applicationName"
                placeholder="Frigg"
                value={generalSettings.applicationName}
                onChange={handleGeneralChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxSessionDuration">Duração Máxima da Sessão (horas)</Label>
              <Input
                id="maxSessionDuration"
                type="number"
                min="1"
                max="720"
                placeholder="24"
                value={generalSettings.maxSessionDuration}
                onChange={handleGeneralChange}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="enableDebugMode">Modo de Depuração</Label>
                <p className="text-sm text-muted-foreground">
                  Ativa logs detalhados e ferramentas de diagnóstico
                </p>
              </div>
              <Switch
                id="enableDebugMode"
                checked={generalSettings.enableDebugMode}
                onCheckedChange={(checked) => handleSwitchChange("enableDebugMode", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="enableAnalytics">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Coleta dados anônimos de uso para melhorar o aplicativo
                </p>
              </div>
              <Switch
                id="enableAnalytics"
                checked={generalSettings.enableAnalytics}
                onCheckedChange={(checked) => handleSwitchChange("enableAnalytics", checked)}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="microsoft" className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              A integração com Microsoft Entra ID permite que usuários façam login 
              usando suas credenciais corporativas da Microsoft.
            </p>
            
            <div className="mb-6 rounded-md border p-4 bg-muted/50">
              <p className="text-sm font-medium">Pré-requisitos para configuração:</p>
              <ol className="ml-5 mt-2 text-sm list-decimal">
                <li className="mt-1">Registre este aplicativo no Portal Azure</li>
                <li className="mt-1">Configure URIs de redirecionamento</li>
                <li className="mt-1">Obtenha o ID do Cliente e o Segredo do Cliente</li>
                <li className="mt-1">Configure o ID do Locatário</li>
              </ol>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="clientId">ID do Cliente (Client ID)</Label>
              <Input
                id="clientId"
                placeholder="Exemplo: 8a4b2c1d-5e3f-6a7b-8c9d-0e1f2a3b4c5d"
                value={microsoftFormData.clientId}
                onChange={handleMicrosoftChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tenantId">ID do Locatário (Tenant ID)</Label>
              <Input
                id="tenantId"
                placeholder="Exemplo: contoso.onmicrosoft.com"
                value={microsoftFormData.tenantId}
                onChange={handleMicrosoftChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="clientSecret">Segredo do Cliente (Client Secret)</Label>
              <Input
                type="password"
                id="clientSecret"
                placeholder="Digite o segredo do cliente"
                value={microsoftFormData.clientSecret}
                onChange={handleMicrosoftChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="redirectUri">URI de Redirecionamento</Label>
              <Input
                id="redirectUri"
                placeholder="https://seu-dominio.com/api/auth/callback/microsoft"
                value={microsoftFormData.redirectUri}
                onChange={handleMicrosoftChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="enableSso" 
                checked={microsoftFormData.enableSso}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="enableSso" className="text-sm font-medium">
                Habilitar login único com Microsoft Entra ID
              </Label>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure as permissões de acesso para usuários autenticados via SSO.
            </p>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mapeamento de Permissões</CardTitle>
                <CardDescription>
                  Configure como as funções do Azure AD são mapeadas para permissões na aplicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Função no Azure AD</Label>
                      <Input placeholder="User" />
                    </div>
                    <div className="space-y-2">
                      <Label>Papel na Aplicação</Label>
                      <Input placeholder="Usuário" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Função no Azure AD</Label>
                      <Input placeholder="Administrator" />
                    </div>
                    <div className="space-y-2">
                      <Label>Papel na Aplicação</Label>
                      <Input placeholder="Administrador" />
                    </div>
                  </div>
                  
                  <Button variant="outline" type="button" className="mt-2">
                    Adicionar Mapeamento
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="autoProvision" />
              <Label htmlFor="autoProvision" className="text-sm font-medium">
                Criar automaticamente contas para novos usuários
              </Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary">
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
} 