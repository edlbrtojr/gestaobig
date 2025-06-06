"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  UserCog, 
  Plus, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  BriefcaseBusiness,
  UserRound,
  Network,
  FileText,
  Settings,
  Search,
  HomeIcon,
  BarChart3,
  Layers,
  Boxes,
  Eye,
  PenLine,
  Trash,
  Share2
} from "lucide-react";

// Tipos de dados para a interface
type AccessLevel = 'none' | 'view' | 'edit' | 'full';

type PageAccess = {
  pageId: string; 
  access: AccessLevel;
};

type PageInfo = {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  icon: React.ReactNode;
};

type Role = {
  id: string;
  name: string;
  description: string;
  pageAccess: PageAccess[]; // Permissões de acesso por página
  isSystem: boolean;
  usersCount: number;
  color?: string;
};

export default function RolesPage() {
  // Estado para controle de modais e alertas
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dados de páginas do sistema
  const pages: PageInfo[] = [
    { id: "home", name: "Dashboard", description: "Página inicial e resumo do sistema", category: "Principal", path: "/", icon: <HomeIcon className="h-4 w-4" /> },
    { id: "graph", name: "Graph", description: "Visualização e edição de grafos", category: "Dados", path: "/graph", icon: <Network className="h-4 w-4" /> },
    { id: "reports", name: "Relatórios", description: "Visualização e geração de relatórios", category: "Dados", path: "/reports", icon: <FileText className="h-4 w-4" /> },
    { id: "analytics", name: "Analytics", description: "Análise avançada e visualização de dados", category: "Dados", path: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "models", name: "Modelos", description: "Gerenciamento de modelos de dados", category: "Sistema", path: "/models", icon: <Layers className="h-4 w-4" /> },
    { id: "nodes", name: "Nós", description: "Gerenciamento de nós", category: "Sistema", path: "/nodes", icon: <Boxes className="h-4 w-4" /> },
    { id: "users", name: "Usuários", description: "Gerenciamento de usuários", category: "Administração", path: "/settings/users", icon: <UserRound className="h-4 w-4" /> },
    { id: "roles", name: "Papéis", description: "Configuração de papéis e permissões", category: "Administração", path: "/settings/roles", icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "settings", name: "Configurações", description: "Configurações gerais do sistema", category: "Administração", path: "/settings", icon: <Settings className="h-4 w-4" /> },
  ];
  
  // Definições de papéis do sistema
  const [roles, setRoles] = useState<Role[]>([
    { 
      id: "admin", 
      name: "Administrador", 
      description: "Acesso completo a todas as funcionalidades do sistema", 
      pageAccess: pages.map(p => ({ pageId: p.id, access: 'full' })),
      isSystem: true,
      usersCount: 2,
      color: "amber",
    },
    { 
      id: "executive", 
      name: "Executivo", 
      description: "Acesso a dashboards, relatórios e análises, sem permissões administrativas", 
      pageAccess: [
        { pageId: "home", access: 'view' },
        { pageId: "graph", access: 'view' },
        { pageId: "reports", access: 'view' },
        { pageId: "analytics", access: 'view' },
        ...pages.filter(p => !["home", "graph", "reports", "analytics"].includes(p.id)).map(p => ({ pageId: p.id, access: 'none' as AccessLevel }))
      ],
      isSystem: true,
      usersCount: 3,
      color: "indigo",
    },
    { 
      id: "manager", 
      name: "Gestor", 
      description: "Pode visualizar e editar dados, gerar relatórios e gerenciar usuários básicos", 
      pageAccess: [
        { pageId: "home", access: 'full' },
        { pageId: "graph", access: 'edit' },
        { pageId: "reports", access: 'full' },
        { pageId: "analytics", access: 'view' },
        { pageId: "models", access: 'view' },
        { pageId: "nodes", access: 'view' },
        { pageId: "users", access: 'edit' },
        { pageId: "roles", access: 'none' },
        { pageId: "settings", access: 'view' },
      ],
      isSystem: true,
      usersCount: 5,
      color: "blue",
    },
    { 
      id: "collaborator", 
      name: "Colaborador", 
      description: "Pode visualizar e editar dados específicos e gerar relatórios básicos", 
      pageAccess: [
        { pageId: "home", access: 'view' },
        { pageId: "graph", access: 'edit' },
        { pageId: "reports", access: 'view' },
        { pageId: "analytics", access: 'none' },
        { pageId: "models", access: 'none' },
        { pageId: "nodes", access: 'none' },
        { pageId: "users", access: 'none' },
        { pageId: "roles", access: 'none' },
        { pageId: "settings", access: 'none' },
      ],
      isSystem: true,
      usersCount: 10,
      color: "green",
    },
    { 
      id: "basic", 
      name: "Básico", 
      description: "Acesso básico apenas para visualização", 
      pageAccess: [
        { pageId: "home", access: 'view' },
        { pageId: "graph", access: 'view' },
        { pageId: "reports", access: 'none' },
        ...pages.filter(p => !["home", "graph", "reports"].includes(p.id)).map(p => ({ pageId: p.id, access: 'none' as AccessLevel }))
      ],
      isSystem: true,
      usersCount: 20,
      color: "gray",
    }
  ]);
  
  // Estados para controle de permissões selecionadas ao editar/criar
  const [selectedPageAccess, setSelectedPageAccess] = useState<PageAccess[]>([]);
  
  // Lista de categorias de páginas
  const pageCategories = [...new Set(pages.map(p => p.category))];
  
  // Funcão para obter o nível de acesso de uma página
  const getPageAccessLevel = (pageId: string): AccessLevel => {
    const pageAccess = selectedPageAccess.find(pa => pa.pageId === pageId);
    return pageAccess ? pageAccess.access : 'none';
  };
  
  // Funções de manipulação
  const handleOpenCreateDialog = () => {
    setEditingRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    // Definir nenhum acesso para todas as páginas
    setSelectedPageAccess(pages.map(p => ({ pageId: p.id, access: 'none' })));
    setIsCreateDialogOpen(true);
  };
  
  const handleOpenEditDialog = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    setSelectedPageAccess([...role.pageAccess]);
    setIsCreateDialogOpen(true);
  };
  
  const handleOpenDeleteAlert = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteAlertOpen(true);
  };
  
  const handleSaveRole = () => {
    if (!newRoleName.trim()) {
      toast.error("O nome do papel é obrigatório.");
      return;
    }
    
    // Validar se há pelo menos algum acesso
    if (!selectedPageAccess.some(pa => pa.access !== 'none')) {
      toast.error("Conceda pelo menos um acesso para continuar.");
      return;
    }
    
    if (editingRole) {
      // Editar papel existente
      setRoles(roles.map(r => 
        r.id === editingRole.id 
          ? { ...r, name: newRoleName, description: newRoleDescription, pageAccess: selectedPageAccess }
          : r
      ));
      toast.success(`Papel "${newRoleName}" atualizado com sucesso.`);
    } else {
      // Criar novo papel
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: newRoleName,
        description: newRoleDescription,
        pageAccess: selectedPageAccess,
        isSystem: false,
        usersCount: 0,
      };
      setRoles([...roles, newRole]);
      toast.success(`Papel "${newRoleName}" criado com sucesso.`);
    }
    
    setIsCreateDialogOpen(false);
  };
  
  const handleDeleteRole = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      toast.success(`Papel "${roleToDelete.name}" excluído com sucesso.`);
      setIsDeleteAlertOpen(false);
    }
  };
  
  const handleChangePageAccess = (pageId: string, access: AccessLevel) => {
    setSelectedPageAccess(prev => 
      prev.map(pa => pa.pageId === pageId ? { ...pa, access } : pa)
    );
  };
  
  const getAccessBadgeVariant = (access: AccessLevel) => {
    switch (access) {
      case 'full': return { variant: 'default', label: 'Completo', icon: <Share2 className="h-3 w-3 mr-1" /> };
      case 'edit': return { variant: 'blue', label: 'Edição', icon: <PenLine className="h-3 w-3 mr-1" /> };
      case 'view': return { variant: 'outline', label: 'Visualização', icon: <Eye className="h-3 w-3 mr-1" /> };
      case 'none': return { variant: 'ghost', label: 'Sem Acesso', icon: <Trash className="h-3 w-3 mr-1" /> };
      default: return { variant: 'ghost', label: 'Nenhum', icon: <Trash className="h-3 w-3 mr-1" /> };
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Principal": return <HomeIcon className="h-4 w-4 mr-2" />;
      case "Dados": return <BarChart3 className="h-4 w-4 mr-2" />;
      case "Sistema": return <Settings className="h-4 w-4 mr-2" />;
      case "Administração": return <ShieldCheck className="h-4 w-4 mr-2" />;
      default: return <Layers className="h-4 w-4 mr-2" />;
    }
  };
  
  // Filtragem de papéis por termo de busca
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Contar o número de páginas com acesso para cada categoria
  const countAccessByCategory = (role: Role, category: string) => {
    const categoryPages = pages.filter(p => p.category === category);
    return categoryPages.filter(p => {
      const access = role.pageAccess.find(pa => pa.pageId === p.id)?.access || 'none';
      return access !== 'none';
    }).length;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Papéis e Permissões</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os papéis e permissões de acesso às páginas do sistema.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar papéis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:max-w-xs"
            />
          </div>
          <Button onClick={handleOpenCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Novo Papel</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredRoles.map(role => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {role.name}
                      </CardTitle>
                      {role.isSystem && (
                        <Badge className={`bg-${role.color || "amber"}-500 hover:bg-${role.color || "amber"}-500/90`}>Sistema</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {role.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {role.usersCount} usuários
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {role.pageAccess.filter(pa => pa.access !== 'none').length} acessos
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {pageCategories.map(category => {
                    const accessCount = countAccessByCategory(role, category);
                    
                    return accessCount > 0 ? (
                      <Badge key={category} variant="outline" className="gap-1">
                        {getCategoryIcon(category)}
                        <span>{category}: {accessCount}</span>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleOpenEditDialog(role)}
                  disabled={role.isSystem}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleOpenDeleteAlert(role)}
                  disabled={role.isSystem}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de criar/editar papel */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Editar Papel" : "Novo Papel"}</DialogTitle>
            <DialogDescription>
              {editingRole 
                ? "Modifique as informações e permissões deste papel." 
                : "Crie um novo papel para definir um conjunto de permissões."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="role-name">Nome do Papel</Label>
                <Input
                  id="role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ex: Analista de Dados"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Descrição</Label>
                <Input
                  id="role-description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Descreva o propósito deste papel"
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <div>
              <Label className="block mb-3">Permissões de Acesso às Páginas</Label>
              <Tabs defaultValue={pageCategories[0]} className="bg-muted/40 p-1 rounded-lg">
                <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${pageCategories.length}, 1fr)` }}>
                  {pageCategories.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs">
                      {getCategoryIcon(category)}
                      <span className="hidden sm:inline">{category}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {pageCategories.map((category) => (
                  <TabsContent key={category} value={category} className="space-y-2 mt-2">
                    <ScrollArea className="max-h-64 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Página</TableHead>
                            <TableHead className="w-2/3">Nível de Acesso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pages
                            .filter(p => p.category === category)
                            .map((page) => {
                              const currentAccess = getPageAccessLevel(page.id);
                              const badge = getAccessBadgeVariant(currentAccess);
                              
                              return (
                                <TableRow key={page.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {page.icon}
                                      <div>
                                        <p className="font-medium">{page.name}</p>
                                        <p className="text-xs text-muted-foreground">{page.description}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={currentAccess}
                                      onValueChange={(value) => handleChangePageAccess(page.id, value as AccessLevel)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione o nível de acesso" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <div className="flex items-center">
                                            <Trash className="h-4 w-4 mr-2" />
                                            <span>Sem Acesso</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="view">
                                          <div className="flex items-center">
                                            <Eye className="h-4 w-4 mr-2" />
                                            <span>Visualização</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="edit">
                                          <div className="flex items-center">
                                            <PenLine className="h-4 w-4 mr-2" />
                                            <span>Edição</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="full">
                                          <div className="flex items-center">
                                            <Share2 className="h-4 w-4 mr-2" />
                                            <span>Acesso Completo</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
              
              <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {selectedPageAccess.filter(pa => pa.access !== 'none').length} páginas com acesso
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} className="gap-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Salvar Papel</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alerta de confirmação de exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToDelete && (
                <>
                  Tem certeza que deseja excluir o papel <strong>{roleToDelete.name}</strong>?
                  {roleToDelete.usersCount > 0 && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800 text-sm">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <span>
                          Este papel está atribuído a <strong>{roleToDelete.usersCount} usuários</strong>. 
                          Eles perderão as permissões associadas a este papel.
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 