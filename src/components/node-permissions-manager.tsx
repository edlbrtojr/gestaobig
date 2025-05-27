"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { 
  fetchAllNodeVisibility, 
  bulkUpdatePermissions, 
  NodeVisibility 
} from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ShieldAlert, EyeOff, CheckSquare, Search, Filter, AlertTriangle, CheckCircle2, Users, ChevronDown, RefreshCcw } from "lucide-react";

export default function NodePermissionsManager() {
  // State for all nodes and their visibility settings
  const [nodes, setNodes] = useState<NodeVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "restricted" | "public">("all");
  
  // Auth context for available roles
  const { availableTestUsers } = useAuth();
  const availableRoles = [...new Set(availableTestUsers.flatMap(user => user.roles))];
  
  // State for bulk operations
  const [selectedOperation, setSelectedOperation] = useState<"grant" | "revoke" | "restrict" | "unrestrict" | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Load nodes on initial render
  useEffect(() => {
    loadNodes();
  }, []);
  
  // Extract available labels
  useEffect(() => {
    if (nodes.length > 0) {
      const labels = new Set<string>();
      nodes.forEach(node => {
        if (node.labels && Array.isArray(node.labels)) {
          node.labels.forEach(label => labels.add(label));
        }
      });
      setAvailableLabels(Array.from(labels).sort());
    }
  }, [nodes]);
  
  // Effect for select all checkbox
  useEffect(() => {
    if (selectAll) {
      const filteredNodeIds = getFilteredNodes().map(node => node.nodeId);
      setSelectedNodes(filteredNodeIds);
    } else if (selectedNodes.length === getFilteredNodes().length) {
      // If all are selected but the selectAll is toggled off
      setSelectedNodes([]);
    }
  }, [selectAll]);
  
  const loadNodes = async () => {
    setLoading(true);
    try {
      const nodeVisibility = await fetchAllNodeVisibility();
      setNodes(nodeVisibility);
    } catch (error) {
      console.error("Failed to load nodes:", error);
      toast.error("Falha ao carregar configurações de visibilidade dos nós");
    } finally {
      setLoading(false);
    }
  };
  
  const handleNodeSelection = (nodeId: number, selected: boolean) => {
    if (selected) {
      setSelectedNodes(prev => [...prev, nodeId]);
    } else {
      setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    }
  };
  
  const getFilteredNodes = () => {
    return nodes.filter(node => {
      // Apply search term filter
      const nameMatch = (node.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const titleMatch = (node.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const searchMatch = searchTerm === "" || nameMatch || titleMatch;
      
      // Apply label filter
      const labelMatch = !labelFilter || (node.labels && node.labels.includes(labelFilter));
      
      // Apply visibility filter
      let visibilityMatch = true;
      if (visibilityFilter === "restricted") {
        visibilityMatch = node.isRestricted === true;
      } else if (visibilityFilter === "public") {
        visibilityMatch = node.isRestricted === false;
      }
      
      return searchMatch && labelMatch && visibilityMatch;
    });
  };
  
  const handleBulkOperation = async () => {
    if (!selectedOperation || selectedNodes.length === 0) {
      toast.warning("Selecione uma operação e pelo menos um nó");
      return;
    }
    
    if ((selectedOperation === "grant" || selectedOperation === "revoke") && selectedRoles.length === 0) {
      toast.warning("Selecione pelo menos um perfil para esta operação");
      return;
    }
    
    const rolesToUse = selectedRoles.length > 0 ? selectedRoles : availableRoles;
    
    try {
      setLoading(true);
      const result = await bulkUpdatePermissions({
        operation: selectedOperation,
        nodeIds: selectedNodes,
        roles: rolesToUse
      });
      
      const operationLabels = {
        grant: "Conceder acesso",
        revoke: "Revogar acesso",
        restrict: "Restringir visibilidade",
        unrestrict: "Tornar público"
      };
      
      toast.success(`Operação "${operationLabels[selectedOperation]}" aplicada com sucesso a ${result} nós/permissões`);
      loadNodes();  // Reload nodes to reflect changes
      setSelectedNodes([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Failed to perform bulk operation:", error);
      toast.error("Falha ao atualizar permissões");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setLabelFilter(null);
    setVisibilityFilter("all");
  };
  
  const filteredNodes = getFilteredNodes();
  
  // Display operation label
  const getOperationLabel = (op: string) => {
    switch (op) {
      case "grant": return "Conceder Acesso";
      case "revoke": return "Revogar Acesso";
      case "restrict": return "Restringir Visibilidade";
      case "unrestrict": return "Tornar Público";
      default: return "Selecionar Operação";
    }
  };
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={loadNodes}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou título..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={labelFilter || ""} onValueChange={(val) => setLabelFilter(val || null)}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {labelFilter || "Filtrar por Tipo"}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os Tipos</SelectItem>
            {availableLabels.map(label => (
              <SelectItem key={label} value={label}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={visibilityFilter} onValueChange={(val: "all" | "restricted" | "public") => setVisibilityFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              {visibilityFilter === "all" 
                ? "Toda Visibilidade" 
                : visibilityFilter === "restricted" 
                  ? "Apenas Restritos"
                  : "Apenas Públicos"}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda Visibilidade</SelectItem>
            <SelectItem value="restricted">Apenas Restritos</SelectItem>
            <SelectItem value="public">Apenas Públicos</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="ghost" onClick={clearFilters} size="icon" title="Limpar filtros">
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Bulk Operations */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium mb-3">Operações em Massa</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Select value={selectedOperation || ""} onValueChange={(val: any) => setSelectedOperation(val)}>
            <SelectTrigger className="w-full md:w-[220px]">
              <div className="flex items-center gap-2">
                {selectedOperation === "grant" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {selectedOperation === "revoke" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {selectedOperation === "restrict" && <EyeOff className="h-4 w-4 text-red-500" />}
                {selectedOperation === "unrestrict" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                {!selectedOperation && <ShieldAlert className="h-4 w-4" />}
                {getOperationLabel(selectedOperation || "")}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grant">Conceder Acesso</SelectItem>
              <SelectItem value="revoke">Revogar Acesso</SelectItem>
              <SelectItem value="restrict">Restringir Visibilidade</SelectItem>
              <SelectItem value="unrestrict">Tornar Público</SelectItem>
            </SelectContent>
          </Select>
          
          {(selectedOperation === "grant" || selectedOperation === "revoke") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Users className="h-4 w-4 mr-2" />
                  Selecionar Perfis
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Perfis Disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableRoles.map(role => (
                  <DropdownMenuItem key={role} onSelect={(e) => {
                    e.preventDefault();
                    setSelectedRoles(prev => 
                      prev.includes(role)
                        ? prev.filter(r => r !== role)
                        : [...prev, role]
                    );
                  }}>
                    <Checkbox 
                      checked={selectedRoles.includes(role)}
                      className="mr-2 h-4 w-4"
                    />
                    {role}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setSelectedRoles(availableRoles);
                }}>
                  Selecionar Todos
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setSelectedRoles([]);
                }}>
                  Limpar Seleção
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedNodes.length} nós selecionados
          </div>
          
          <Button 
            onClick={handleBulkOperation}
            disabled={loading || selectedNodes.length === 0 || !selectedOperation}
          >
            Aplicar aos Selecionados
          </Button>
        </div>
        
        {selectedRoles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedRoles.map(role => (
              <Badge key={role} variant="secondary" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Node Table */}
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {loading ? "Carregando configurações de visibilidade..." : `${filteredNodes.length} nós`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredNodes.length > 0 && selectedNodes.length === filteredNodes.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Nó</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Visibilidade</TableHead>
              <TableHead>Visível Para</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando configurações de visibilidade...
                </TableCell>
              </TableRow>
            ) : filteredNodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhum nó corresponde aos filtros atuais
                </TableCell>
              </TableRow>
            ) : (
              filteredNodes.map((node) => (
                <TableRow key={node.nodeId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNodes.includes(node.nodeId)}
                      onCheckedChange={(checked) => 
                        handleNodeSelection(node.nodeId, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {node.name || node.title || `Nó #${node.nodeId}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {node.labels && node.labels.map(label => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {node.isRestricted ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Restrito
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Público
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!node.isRestricted ? (
                        <Badge variant="secondary">Todos os Perfis</Badge>
                      ) : (node.roles && node.roles.length > 0) ? (
                        node.roles.map(role => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Sem Acesso
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          {selectedNodes.length} de {nodes.length} nós selecionados
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSelectedNodes([])}
          disabled={selectedNodes.length === 0}
        >
          Limpar Seleção
        </Button>
      </div>
    </div>
  );
} 