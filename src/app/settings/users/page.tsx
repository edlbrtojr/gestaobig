"use client";

import { useState, useEffect, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, 
  UserCog, 
  Shield, 
  Calendar, 
  UsersRound,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  Search,
  FilterX,
  LayoutGrid,
  LayoutList,
  Filter,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type UserData = {
  id: string;
  name: string;
  email: string;
  authType: 'local' | 'sso';
  isSystemAdmin: boolean;
  active: boolean;
  createdAt?: string;
  lastLogin?: string;
};

type ViewMode = 'cards' | 'table';
type FilterOptions = {
  onlyAdmin: boolean;
  onlyActive: boolean;
  sortBy: 'name' | 'email' | 'lastLogin' | 'createdAt';
  sortDirection: 'asc' | 'desc';
};

export default function UsersSettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("local-users");
  const [localUsers, setLocalUsers] = useState<UserData[]>([]);
  const [ssoUsers, setSsoUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    onlyAdmin: false,
    onlyActive: false,
    sortBy: 'name',
    sortDirection: 'asc',
  });

  useEffect(() => {
    const fetchUsers = async (type: string) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/users?type=${type}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch users');
        }
        
        // Log para depuração do formato de data
        console.log('Formato das datas recebidas da API:', data.data.map((user: UserData) => ({
          id: user.id,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        })));
        
        return data.data || [];
      } catch (error: any) {
        console.error(`Failed to fetch ${type} users:`, error);
        const errorMessage = error.message || `Não foi possível carregar os usuários ${type === 'local' ? 'locais' : 'SSO'}.`;
        setError(errorMessage);
        toast.error(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "local-users") {
      fetchUsers("local").then(setLocalUsers);
    } else if (activeTab === "sso-users") {
      fetchUsers("sso").then(setSsoUsers);
    }
    // We don't need to fetch for the third tab as it's not functional yet
  }, [activeTab]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateInput?: any) => {
    if (!dateInput) return "N/A";
    
    try {
      let date: Date;
      
      // Verificar se é um objeto com propriedades de data ou uma string
      if (typeof dateInput === 'object' && dateInput !== null && 'year' in dateInput) {
        // É um objeto de data com {year, month, day, ...}
        const d = dateInput as Record<string, number>;
        // Meses em JavaScript são 0-indexed (0-11)
        date = new Date(
          d.year, 
          d.month - 1, 
          d.day, 
          d.hour || 0, 
          d.minute || 0, 
          d.second || 0
        );
      } else if (typeof dateInput === 'string') {
        // É uma string de data
        let normalizedDateStr = dateInput;
        if (dateInput && !dateInput.endsWith('Z')) {
          normalizedDateStr = dateInput + 'Z';
        }
        
        // Remover possíveis zeros extras na fração de segundos
        normalizedDateStr = normalizedDateStr.replace(/(\.\d{3})\d+Z$/, '$1Z');
        
        date = new Date(normalizedDateStr);
      } else {
        // Tentar usar o construtor Date diretamente
        date = new Date(dateInput);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateInput);
        return "Data inválida";
      }
      
      // Converter para UTC-5 (Lima, Quito, Rio Branco, Acre)
      const utcDate = new Date(date.toISOString());
      
      // UTC-5 = -5 * 60 minutos = -300 minutos
      const offsetMinutes = -300;
      
      // Ajustar para UTC-5 adicionando o offset
      const targetDate = new Date(utcDate.getTime() + offsetMinutes * 60 * 1000);
      
      // Usar formato completo de data e hora em UTC-5
      return targetDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' (UTC-5)';
    } catch (error) {
      console.error("Erro ao formatar data:", dateInput, error);
      return "Erro no formato";
    }
  };

  const handleRefresh = () => {
    if (activeTab === "local-users") {
      setLocalUsers([]);
      fetchUsers("local").then(setLocalUsers);
    } else if (activeTab === "sso-users") {
      setSsoUsers([]);
      fetchUsers("sso").then(setSsoUsers);
    }
  };

  const fetchUsers = async (type: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users?type=${type}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      // Log para depuração do formato de data
      console.log('Formato das datas recebidas da API:', data.data.map((user: UserData) => ({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      })));
      
      return data.data || [];
    } catch (error: any) {
      console.error(`Failed to fetch ${type} users:`, error);
      const errorMessage = error.message || `Não foi possível carregar os usuários ${type === 'local' ? 'locais' : 'SSO'}.`;
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterOptions({
      onlyAdmin: false,
      onlyActive: false,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  };

  const filteredUsers = useMemo(() => {
    const currentUsers = activeTab === "local-users" ? localUsers : ssoUsers;
    
    return currentUsers.filter(user => {
      // Apply text search filter
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply role filter
      const matchesAdmin = !filterOptions.onlyAdmin || user.isSystemAdmin;
      
      // Apply active status filter
      const matchesActive = !filterOptions.onlyActive || user.active;
      
      return matchesSearch && matchesAdmin && matchesActive;
    }).sort((a, b) => {
      const sortBy = filterOptions.sortBy;
      const direction = filterOptions.sortDirection === 'asc' ? 1 : -1;
      
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * direction;
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email) * direction;
      } else if (sortBy === 'lastLogin') {
        const aDate = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const bDate = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        return (aDate - bDate) * direction;
      } else if (sortBy === 'createdAt') {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (aDate - bDate) * direction;
      }
      return 0;
    });
  }, [activeTab, localUsers, ssoUsers, searchTerm, filterOptions]);

  const renderSearchAndFilter = () => {
    return (
      <div className="bg-muted/30 p-4 rounded-lg mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <div className="flex-col items-start gap-2 p-4">
                    <div className="flex items-center justify-between space-x-2 w-full">
                      <Label htmlFor="admin-filter">Apenas administradores</Label>
                      <Switch 
                        id="admin-filter" 
                        checked={filterOptions.onlyAdmin}
                        onCheckedChange={(checked) => 
                          setFilterOptions({...filterOptions, onlyAdmin: checked})
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-col items-start gap-2 p-4">
                    <div className="flex items-center justify-between space-x-2 w-full">
                      <Label htmlFor="active-filter">Apenas ativos</Label>
                      <Switch 
                        id="active-filter" 
                        checked={filterOptions.onlyActive}
                        onCheckedChange={(checked) => 
                          setFilterOptions({...filterOptions, onlyActive: checked})
                        }
                      />
                    </div>
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="mt-2">Ordenação</DropdownMenuLabel>
                <div className="flex-col items-start gap-2 p-4">
                  <div className="flex items-center justify-between space-x-2 w-full">
                    <Label htmlFor="sort-by">Ordenar por</Label>
                    <Select 
                      value={filterOptions.sortBy}
                      onValueChange={(value) => {
                        setFilterOptions({...filterOptions, sortBy: value as any});
                      }}
                    >
                      <SelectTrigger 
                        className="w-[120px]" 
                        id="sort-by"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="lastLogin">Último login</SelectItem>
                        <SelectItem value="createdAt">Data de criação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-col items-start gap-2 p-4">
                  <div className="flex items-center justify-between space-x-2 w-full">
                    <Label htmlFor="sort-direction">Direção</Label>
                    <Select 
                      value={filterOptions.sortDirection}
                      onValueChange={(value) => {
                        setFilterOptions({...filterOptions, sortDirection: value as any});
                      }}
                    >
                      <SelectTrigger 
                        className="w-[120px]" 
                        id="sort-direction"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClearFilters}
              title="Limpar filtros"
            >
              <FilterX className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            <div className="flex items-center">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-muted' : ''}
                title="Visualizar em cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-muted' : ''}
                title="Visualizar em tabela"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {(searchTerm || filterOptions.onlyAdmin || filterOptions.onlyActive) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} resultados encontrados
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 gap-1">
              <FilterX className="h-3.5 w-3.5" />
              <span>Limpar filtros</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderUserCards = (users: UserData[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 mt-1">
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-medium">{user.name}</CardTitle>
                      <CardDescription className="text-sm">{user.email}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {user.isSystemAdmin && (
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/90">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      )}
                      <Badge variant={user.active ? "outline" : "destructive"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="secondary">
                        {user.authType === "local" ? "Local" : "SSO"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Criado: {formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Último login: {formatDate(user.lastLogin)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderUserTable = (users: UserData[]) => {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Função</TableHead>
              <TableHead className="whitespace-nowrap">Criado em</TableHead>
              <TableHead className="whitespace-nowrap">Último login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[180px]" title={user.name}>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="truncate max-w-[180px] block" title={user.email}>{user.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {user.authType === "local" ? "Local" : "SSO"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? "outline" : "destructive"} className="font-normal">
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isSystemAdmin ? (
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/90 font-normal">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Usuário</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(user.lastLogin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderUserList = (users: UserData[]) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">Tentar novamente</Button>
        </div>
      );
    }

    if (users.length === 0) {
      if (searchTerm || filterOptions.onlyAdmin || filterOptions.onlyActive) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Nenhum usuário corresponde aos filtros aplicados.</p>
            <Button onClick={handleClearFilters} variant="outline" className="mt-4 gap-2">
              <FilterX className="h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>Nenhum usuário encontrado.</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      );
    }

    return viewMode === 'cards' ? renderUserCards(users) : renderUserTable(users);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gerenciamento de Usuários</h3>
          <p className="text-sm text-muted-foreground">
            Visualize e gerencie os usuários do sistema.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="local-users" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="local-users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Usuários Locais</span>
          </TabsTrigger>
          <TabsTrigger value="sso-users" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>Usuários do AD</span>
          </TabsTrigger>
          <TabsTrigger value="ad-users" className="flex items-center gap-2" disabled>
            <UserX className="h-4 w-4" />
            <span>Usuários AD Não Logados</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="local-users" className="space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium">Usuários Locais</h4>
              <Badge variant="outline" className="gap-1">
                <UsersRound className="h-3.5 w-3.5" />
                {localUsers.length} usuários
              </Badge>
            </div>
            
            {renderSearchAndFilter()}
            {renderUserList(filteredUsers)}
          </TabsContent>

          <TabsContent value="sso-users" className="space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium">Usuários do Active Directory</h4>
              <Badge variant="outline" className="gap-1">
                <UsersRound className="h-3.5 w-3.5" />
                {ssoUsers.length} usuários
              </Badge>
            </div>
            
            {renderSearchAndFilter()}
            {renderUserList(filteredUsers)}
          </TabsContent>

          <TabsContent value="ad-users" className="space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium">Usuários do AD Não Logados</h4>
              <Badge variant="secondary">Em desenvolvimento</Badge>
            </div>
            <div className="p-8 text-center border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">
                Esta funcionalidade ainda não está disponível.
                <br />
                Aqui serão exibidos os usuários que existem no Active Directory mas que nunca logaram no sistema.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 