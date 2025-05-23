"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrganizationConfig } from "@/app/api/config/route";
import type { StrategicNode } from "@/app/api/strategic-nodes/route";
import { PlusCircle, Save, Trash, Edit, X, Check, Moon, Sun, Building, Palette, FileText, Layout, Settings, Share, Globe } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { FileUpload } from "@/components/file-upload";
import { useOrganizationConfig } from "@/components/org-config-provider";
import { Badge } from "@/components/ui/badge";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

// Memoized logo preview component to prevent unnecessary re-renders
const LogoPreview = memo(({ src, alt, isDarkMode = false }: { src: string, alt: string, isDarkMode?: boolean }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Reset state when src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);
  
  return (
    <div className={`border rounded-md p-4 flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'} h-32`}>
      {!error ? (
        <img 
          src={src} 
          alt={alt} 
          className={`max-h-24 object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          style={{ maxWidth: '100%' }}
        />
      ) : (
        <div className="text-muted-foreground text-sm flex flex-col items-center">
          <span className="mb-2">Imagem não encontrada</span>
          <span className="text-xs opacity-70">{src}</span>
        </div>
      )}
    </div>
  );
});

LogoPreview.displayName = 'LogoPreview';

// Key Feature Card Component
interface KeyFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  inDevelopment?: boolean;
}

const KeyFeature = memo(({ title, description, icon, enabled, onToggle, inDevelopment = false }: KeyFeatureProps) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 ${enabled ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-start">
            <div className={`p-2 rounded-md ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
              {icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h5 className="font-medium text-base">{title}</h5>
                {inDevelopment && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300">
                    EM DESENVOLVIMENTO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={onToggle}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
});

KeyFeature.displayName = 'KeyFeature';

export default function OrganizationSettingsForm() {
  // Organization config state
  const [config, setConfig] = useState<OrganizationConfig>({
    name: "",
    shortName: "",
    logoUrl: "",
    logoSmallUrl: "",
    faviconUrl: "",
    primaryColor: "",
    secondaryColor: "",
    tertiaryColor: "",
    footerText: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    theme: {
      defaultMode: "light",
      enableSystem: true,
      lightLogo: "",
      darkLogo: "",
    }
  });

  // Strategic nodes state
  const [nodes, setNodes] = useState<StrategicNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");

  // State for editing strategic nodes
  const [editingNode, setEditingNode] = useState<StrategicNode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // State for creating new nodes
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);
  const [newNode, setNewNode] = useState<StrategicNode>({
    label: "Visao",
    name: "",
    description: "",
    company: "SISTEMA FIEAC",
  });

  // State for delete confirmation
  const [nodeToDelete, setNodeToDelete] = useState<StrategicNode | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Success/error alerts
  const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
  const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get organization context
  const { saveConfig } = useOrganizationConfig();

  // Feature flags state
  const { featureFlags, updateFeatureFlags, isFeatureEnabled } = useFeatureFlags();

  // Load configuration and strategic nodes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch organization config
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }

        // Fetch strategic nodes
        const nodesRes = await fetch('/api/strategic-nodes');
        if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          // Ensure all nodes have string IDs
          const processedNodes = (nodesData.nodes || []).map((node: any) => ({
            ...node,
            id: node.id ? String(node.id) : `node-${Math.random().toString(36).substr(2, 9)}`
          }));
          setNodes(processedNodes);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setErrorMessage("Failed to load data. Please try again.");
        setIsErrorAlertOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handler for input changes in organization config
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for theme changes
  const handleThemeChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      }
    }));
  };

  // Handle file upload
  const handleFileUpload = async (file: File, dataUrl: string, fieldName: string) => {
    // Update state immediately with data URL for preview
    if (fieldName === "lightLogo" || fieldName === "darkLogo") {
      handleThemeChange(fieldName, dataUrl);
    } else {
      setConfig((prev) => ({
        ...prev,
        [fieldName]: dataUrl,
      }));
    }

    if (!file.size) return; // Empty file, just clear the field

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { filePath } = await response.json();
      
      // Update with server path
      if (fieldName === "lightLogo" || fieldName === "darkLogo") {
        handleThemeChange(fieldName, filePath);
      } else {
        setConfig((prev) => ({
          ...prev,
          [fieldName]: filePath,
        }));
      }

      toast.success("Arquivo enviado com sucesso");
    } catch (error) {
      console.error('File upload error:', error);
      toast.error("Falha ao enviar o arquivo. Tente novamente.");
    }
  };

  // Save organization config
  const saveOrganizationConfig = async () => {
    setIsSaving(true);
    try {
      const success = await saveConfig(config);
      
      if (!success) {
        throw new Error('Failed to save organization settings');
      }

      setIsSuccessAlertOpen(true);
      toast.success("Configurações da organização salvas com sucesso");
    } catch (error) {
      console.error('Error saving config:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings');
      setIsErrorAlertOpen(true);
      toast.error("Falha ao salvar configurações da organização");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit strategic node
  const handleEditNode = (node: StrategicNode) => {
    setEditingNode({ ...node });
    setIsEditDialogOpen(true);
  };

  // Update node form fields
  const handleNodeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingNode) {
      setEditingNode((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [name]: value,
        } as StrategicNode;
      });
    } else {
      setNewNode((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle type change for new node
  const handleNodeTypeChange = (type: "Visao" | "Missao" | "Estrategia") => {
    setNewNode((prev) => ({ ...prev, label: type as "Visao" | "Missao" | "Estrategia" }));
  };

  // Save edited node
  const saveNodeEdit = async () => {
    if (!editingNode) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/strategic-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node: editingNode }),
      });

      if (!response.ok) {
        throw new Error('Failed to update node');
      }

      const { node } = await response.json();

      // Update nodes list
      setNodes((prev) => 
        prev.map((n) => (n.id === node.id ? node : n))
      );

      setIsEditDialogOpen(false);
      toast.success("Nó atualizado com sucesso");
    } catch (error) {
      console.error('Error updating node:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update node');
      setIsErrorAlertOpen(true);
      toast.error("Falha ao atualizar nó");
    } finally {
      setIsSaving(false);
    }
  };

  // Create new node
  const createNode = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/strategic-nodes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node: newNode }),
      });

      if (!response.ok) {
        throw new Error('Failed to create node');
      }

      const { node } = await response.json();

      // Add new node to list
      setNodes((prev) => [...prev, node]);

      // Reset form
      setNewNode({
        label: "Visao",
        name: "",
        description: "",
        company: "SISTEMA FIEAC",
      });
      
      setIsNewNodeDialogOpen(false);
      toast.success("Nó criado com sucesso");
    } catch (error) {
      console.error('Error creating node:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create node');
      setIsErrorAlertOpen(true);
      toast.error("Falha ao criar nó");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete node
  const confirmDeleteNode = async () => {
    if (!nodeToDelete?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/strategic-nodes?id=${nodeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete node');
      }

      // Remove node from list
      setNodes((prev) => prev.filter((n) => n.id !== nodeToDelete.id));
      
      setIsDeleteDialogOpen(false);
      toast.success("Nó excluído com sucesso");
    } catch (error) {
      console.error('Error deleting node:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete node');
      setIsErrorAlertOpen(true);
      toast.error("Falha ao excluir nó");
    } finally {
      setIsSaving(false);
      setNodeToDelete(null);
    }
  };

  // Group nodes by type
  const strategicNodesByType = useMemo(() => {
    // Create a fresh object each time to avoid stale references
    const result: Record<string, StrategicNode[]> = {
      Visao: [],
      Missao: [],
      Estrategia: []
    };
    
    // Process each node and add to the appropriate array
    nodes.forEach((node, index) => {
      // Make sure label exists and is a valid category
      const label = node.label || 'Unknown';
      
      // Initialize the array if it doesn't exist yet
      if (!result[label]) {
        result[label] = [];
      }
      
      // Create a new node object with guaranteed ID
      const processedNode: StrategicNode = {
        ...node,
        id: String(node.id || `node-${index}-${Math.random().toString(36).substring(2, 9)}`),
        name: node.name || '',
        description: node.description || '',
        company: node.company || 'SISTEMA FIEAC',
        label: (node.label || 'Unknown') as any
      };
      
      // Add the processed node to the appropriate array
      result[label].push(processedNode);
    });
    
    return result;
  }, [nodes]);

  // Tab content for Content tab - Strategic Content Management 
  const renderContentTab = () => (
    <TabsContent key="content-content" value="content" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Principais</CardTitle>
          <CardDescription>
            Ative ou desative recursos principais da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <KeyFeature 
              key="strategic-graph"
              title="Gráfico Estratégico"
              description="Visualização interativa de relacionamentos estratégicos entre os nós."
              icon={<Layout className="h-4 w-4 text-primary" />}
              enabled={isFeatureEnabled('graphEnabled')}
              onToggle={(enabled) => {
                updateFeatureFlags({ graphEnabled: enabled });
                toast.success(enabled ? "Funcionalidade ativada" : "Funcionalidade desativada");
              }}
            />
            <KeyFeature 
              key="advanced-reports"
              title="Relatórios Avançados"
              description="Geração de relatórios e análises de dados do seu conteúdo estratégico."
              icon={<FileText className="h-4 w-4 text-primary" />}
              enabled={isFeatureEnabled('advancedReportsEnabled')}
              inDevelopment={true}
              onToggle={(enabled) => {
                updateFeatureFlags({ advancedReportsEnabled: enabled });
                toast.success(enabled ? "Funcionalidade ativada" : "Funcionalidade desativada");
                toast.info("Esta funcionalidade está em desenvolvimento.");
              }}
            />
            <KeyFeature 
              key="data-sharing"
              title="Compartilhamento de Dados"
              description="Compartilhe relatórios e gráficos com usuários externos."
              icon={<Share className="h-4 w-4 text-primary" />}
              enabled={isFeatureEnabled('dataSharingEnabled')}
              inDevelopment={true}
              onToggle={(enabled) => {
                updateFeatureFlags({ dataSharingEnabled: enabled });
                toast.success(enabled ? "Funcionalidade ativada" : "Funcionalidade desativada");
                toast.info("Esta funcionalidade está em desenvolvimento.");
              }}
            />
            <KeyFeature 
              key="api-integration"
              title="Integração com APIs Externas"
              description="Conecte-se a serviços externos para importar e exportar dados."
              icon={<Globe className="h-4 w-4 text-primary" />}
              enabled={isFeatureEnabled('apiIntegrationEnabled')}
              inDevelopment={true}
              onToggle={(enabled) => {
                updateFeatureFlags({ apiIntegrationEnabled: enabled });
                toast.success(enabled ? "Funcionalidade ativada" : "Funcionalidade desativada");
                toast.info("Esta funcionalidade está em desenvolvimento.");
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nós Estratégicos</CardTitle>
            <CardDescription>
              Gerencie os nós estratégicos da sua organização.
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsNewNodeDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar Nó
          </Button>
        </CardHeader>
        <CardContent>
          {/* Visão Nodes */}
          <div className="space-y-4 mb-6">
            <h4 className="text-md font-semibold flex items-center gap-2">
              <Layout className="h-4 w-4" /> Visão
            </h4>
            {strategicNodesByType.Visao?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {strategicNodesByType.Visao.map((node, index) => {
                  // Ensure we have a stable, unique key
                  const nodeKey = `visao-${node.id || index}-${index}`;
                  return (
                    <StrategicNodeCard
                      key={nodeKey}
                      node={node}
                      onEdit={() => handleEditNode(node)}
                      onDelete={() => {
                        setNodeToDelete(node);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum nó de visão cadastrado.
              </p>
            )}
          </div>

          <Separator />

          {/* Missão Nodes */}
          <div className="space-y-4 my-6">
            <h4 className="text-md font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Missão
            </h4>
            {strategicNodesByType.Missao?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {strategicNodesByType.Missao.map((node, index) => {
                  // Ensure we have a stable, unique key
                  const nodeKey = `missao-${node.id || index}-${index}`;
                  return (
                    <StrategicNodeCard
                      key={nodeKey}
                      node={node}
                      onEdit={() => handleEditNode(node)}
                      onDelete={() => {
                        setNodeToDelete(node);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum nó de missão cadastrado.
              </p>
            )}
          </div>

          <Separator />

          {/* Estratégia Nodes */}
          <div className="space-y-4 mt-6">
            <h4 className="text-md font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" /> Estratégia
            </h4>
            {strategicNodesByType.Estrategia?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {strategicNodesByType.Estrategia.map((node, index) => {
                  // Ensure we have a stable, unique key
                  const nodeKey = `estrategia-${node.id || index}-${index}`;
                  return (
                    <StrategicNodeCard
                      key={nodeKey}
                      node={node}
                      onEdit={() => handleEditNode(node)}
                      onDelete={() => {
                        setNodeToDelete(node);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum nó de estratégia cadastrado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );

  // Tab content for Advanced tab - Advanced Settings
  const renderAdvancedTab = () => (
    <TabsContent key="advanced-content" value="advanced" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>
            Opções avançadas para personalização da plataforma.
            <Badge variant="outline" className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300">
              EM DESENVOLVIMENTO
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Customização de Interface</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="animations">Animações da Interface</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative ou desative animações na interface
                    </p>
                  </div>
                  <Switch id="animations" defaultChecked={true} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuBg">Cor de Fundo do Menu</Label>
                  <div className="flex gap-2">
                    <Input
                      id="menuBg"
                      type="text"
                      placeholder="#f8f9fa" 
                      defaultValue="#f8f9fa"
                      disabled
                    />
                    <input
                      type="color"
                      defaultValue="#f8f9fa"
                      className="h-10 w-10 rounded border"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Configurações de Desempenho</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="lazyLoading">Carregamento Lazy</Label>
                    <p className="text-sm text-muted-foreground">
                      Carregamento gradual de conteúdo para melhorar desempenho
                    </p>
                  </div>
                  <Switch id="lazyLoading" defaultChecked={true} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheTime">Tempo de Cache (minutos)</Label>
                  <Select defaultValue="15" disabled>
                    <SelectTrigger id="cacheTime">
                      <SelectValue placeholder="Selecione o tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="5" value="5">5 minutos</SelectItem>
                      <SelectItem key="15" value="15">15 minutos</SelectItem>
                      <SelectItem key="30" value="30">30 minutos</SelectItem>
                      <SelectItem key="60" value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">API e Integrações</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave API</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    value="●●●●●●●●●●●●●●●●●●●●"
                    disabled
                  />
                  <Button variant="outline" disabled>Gerar Nova</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use esta chave para acessar a API da plataforma
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="webhooks">Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações para URLs externas
                  </p>
                </div>
                <Switch id="webhooks" defaultChecked={false} disabled />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Dados e Privacidade</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Coleta de Dados Analíticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Coleta anônima de dados para melhorar a aplicação
                  </p>
                </div>
                <Switch id="analytics" defaultChecked={true} disabled />
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full md:w-auto" disabled>Exportar Dados</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Central de Configurações</h2>
          <p className="text-muted-foreground">
            Personalize a aparência e comportamento da sua aplicação.
          </p>
        </div>

        <Button 
          onClick={saveOrganizationConfig} 
          disabled={isLoading || isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs defaultValue="branding" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger key="branding-tab" value="branding" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Identidade</span>
          </TabsTrigger>
          <TabsTrigger key="appearance-tab" value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Aparência</span>
          </TabsTrigger>
          <TabsTrigger key="content-tab" value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger key="advanced-tab" value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Avançado</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab - Organizational Identity */}
        <TabsContent key="branding-content" value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Organização</CardTitle>
              <CardDescription>
                Defina as informações básicas da sua organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Organização</Label>
                  <Input
                    id="name"
                    name="name"
                    value={config.name}
                    onChange={handleConfigChange}
                    placeholder="Ex: Federação das Indústrias do Estado do Acre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName">Nome Curto</Label>
                  <Input
                    id="shortName"
                    name="shortName"
                    value={config.shortName}
                    onChange={handleConfigChange}
                    placeholder="Ex: FIEAC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Input
                  id="footerText"
                  name="footerText"
                  value={config.footerText}
                  onChange={handleConfigChange}
                  placeholder="© 2023 FIEAC - Todos os direitos reservados"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contato</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    value={config.contactEmail}
                    onChange={handleConfigChange}
                    placeholder="contato@fieac.org.br"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone de Contato</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={config.contactPhone}
                    onChange={handleConfigChange}
                    placeholder="(68) 3212-4200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={config.address}
                  onChange={handleConfigChange}
                  placeholder="Rua Rui Barbosa, 735 - Centro, Rio Branco - AC, 69900-084"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>
                Configure os logotipos e cores da sua marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Light Mode Logo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium">Logo para Tema Claro</h4>
                      <p className="text-sm text-muted-foreground">
                        Logo utilizado quando o tema claro estiver ativo
                      </p>
                    </div>
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <FileUpload
                    previewUrl={config.theme.lightLogo}
                    onFileSelected={(file, dataUrl) => handleFileUpload(file, dataUrl, "lightLogo")}
                    label="Enviar logo para tema claro"
                    maxSizeMB={1}
                  />
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium">Logo para Tema Escuro</h4>
                      <p className="text-sm text-muted-foreground">
                        Logo utilizado quando o tema escuro estiver ativo
                      </p>
                    </div>
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <FileUpload
                    previewUrl={config.theme.darkLogo}
                    onFileSelected={(file, dataUrl) => handleFileUpload(file, dataUrl, "darkLogo")}
                    label="Enviar logo para tema escuro"
                    maxSizeMB={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr,1fr]">
                  <Input
                    id="faviconUrl"
                    name="faviconUrl"
                    value={config.faviconUrl}
                    onChange={handleConfigChange}
                    placeholder="/favicon.ico"
                  />
                  <FileUpload
                    previewUrl={config.faviconUrl}
                    onFileSelected={(file, dataUrl) => handleFileUpload(file, dataUrl, "faviconUrl")}
                    label="Enviar favicon"
                    maxSizeMB={0.5}
                    accept=".ico,.png,.svg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab - Visual Settings */}
        <TabsContent key="appearance-content" value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cores e Temas</CardTitle>
              <CardDescription>
                Personalize as cores e o tema da aplicação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      value={config.primaryColor}
                      onChange={handleConfigChange}
                      placeholder="#004a93"
                    />
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-10 w-10 rounded border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      value={config.secondaryColor}
                      onChange={handleConfigChange}
                      placeholder="#f4791f"
                    />
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="h-10 w-10 rounded border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tertiaryColor">Cor Terciária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tertiaryColor"
                      name="tertiaryColor"
                      value={config.tertiaryColor}
                      onChange={handleConfigChange}
                      placeholder="#e5e5e5"
                    />
                    <input
                      type="color"
                      value={config.tertiaryColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, tertiaryColor: e.target.value }))}
                      className="h-10 w-10 rounded border"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div key="primary-color" className="h-16 w-16 rounded shadow-sm" style={{ backgroundColor: config.primaryColor }} />
                <div key="secondary-color" className="h-16 w-16 rounded shadow-sm" style={{ backgroundColor: config.secondaryColor }} />
                <div key="tertiary-color" className="h-16 w-16 rounded shadow-sm" style={{ backgroundColor: config.tertiaryColor }} />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium">Configurações de Tema</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultMode">Tema Padrão</Label>
                    <Select
                      value={config.theme.defaultMode}
                      onValueChange={(value) => handleThemeChange("defaultMode", value)}
                    >
                      <SelectTrigger id="defaultMode">
                        <SelectValue placeholder="Selecione o tema padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="light" value="light">Claro</SelectItem>
                        <SelectItem key="dark" value="dark">Escuro</SelectItem>
                        <SelectItem key="system" value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableSystem">Permitir tema do sistema</Label>
                      <Switch
                        id="enableSystem"
                        checked={config.theme.enableSystem}
                        onCheckedChange={(checked) => handleThemeChange("enableSystem", checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quando ativado, permite que o tema siga as preferências do sistema do usuário
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab - Strategic Content Management */}
        {renderContentTab()}

        {/* Advanced Tab - Advanced Settings */}
        {renderAdvancedTab()}
      </Tabs>

      {/* Dialog components remain unchanged */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar {editingNode?.label}</DialogTitle>
            <DialogDescription>
              Edite as informações do nó estratégico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                name="name"
                value={editingNode?.name || ""}
                onChange={handleNodeFormChange}
                placeholder="Nome do nó"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editingNode?.description || ""}
                onChange={handleNodeFormChange}
                placeholder="Descrição do nó"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                name="company"
                value={editingNode?.company || ""}
                onChange={handleNodeFormChange}
                placeholder="Ex: SISTEMA FIEAC"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveNodeEdit}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewNodeDialogOpen} onOpenChange={setIsNewNodeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Nó</DialogTitle>
            <DialogDescription>
              Crie um novo nó estratégico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-type">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newNode.label === 'Visao' ? 'default' : 'outline'}
                  onClick={() => handleNodeTypeChange('Visao')}
                  className="flex-1"
                >
                  Visão
                </Button>
                <Button
                  type="button"
                  variant={newNode.label === 'Missao' ? 'default' : 'outline'}
                  onClick={() => handleNodeTypeChange('Missao')}
                  className="flex-1"
                >
                  Missão
                </Button>
                <Button
                  type="button"
                  variant={newNode.label === 'Estrategia' ? 'default' : 'outline'}
                  onClick={() => handleNodeTypeChange('Estrategia')}
                  className="flex-1"
                >
                  Estratégia
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                name="name"
                value={newNode.name}
                onChange={handleNodeFormChange}
                placeholder="Nome do nó"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Descrição</Label>
              <Textarea
                id="new-description"
                name="description"
                value={newNode.description}
                onChange={handleNodeFormChange}
                placeholder="Descrição do nó"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-company">Empresa</Label>
              <Input
                id="new-company"
                name="company"
                value={newNode.company}
                onChange={handleNodeFormChange}
                placeholder="Ex: SISTEMA FIEAC"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewNodeDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={createNode}
              disabled={isSaving || !newNode.name || !newNode.description}
            >
              {isSaving ? "Criando..." : "Criar Nó"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o nó "{nodeToDelete?.name}"? Esta ação não pode ser desfeita e também
              removerá todos os relacionamentos associados a este nó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNode}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Strategic Node Card Component
interface StrategicNodeCardProps {
  node: StrategicNode;
  onEdit: () => void;
  onDelete: () => void;
}

const StrategicNodeCard = memo(({ node, onEdit, onDelete }: StrategicNodeCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-1">
            <h5 className="font-medium text-base">{node.name}</h5>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {node.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Empresa: {node.company}
            </p>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StrategicNodeCard.displayName = 'StrategicNodeCard'; 