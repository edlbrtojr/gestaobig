"use client";

import { Metadata } from "next";
import NodePermissionsManager from "@/components/node-permissions-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Gerenciamento de Visibilidade de Nós | Frigg",
  description: "Configure quais usuários podem ver quais nós no grafo.",
};

export default function NodePermissionsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Visibilidade de Nós</CardTitle>
          </div>
          <CardDescription>
            Configure quais perfis de usuários podem visualizar quais nós no grafo. Nós ocultos terão suas conexões também ocultadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NodePermissionsManager />
        </CardContent>
      </Card>
    </div>
  );
} 