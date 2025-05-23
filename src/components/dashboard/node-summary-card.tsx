"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNeo4jData } from "@/lib/hooks/use-neo4j-data";
import { useRouter } from "next/navigation";

interface NodeSummaryCardProps {
  title: string;
  nodeLabel: string;
  icon?: React.ReactNode;
  color?: string;
  limit?: number;
}

export function NodeSummaryCard({
  title,
  nodeLabel,
  icon,
  color = "#1E40AF",
  limit = 5,
}: NodeSummaryCardProps) {
  const router = useRouter();
  const { nodes, loading, error } = useNeo4jData({
    nodeLabels: [nodeLabel],
  });

  const handleNodeClick = (id: string) => {
    router.push(`/graph?node=${id}`);
  };

  const getBadgeStyle = () => {
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}40`,
    };
  };

  if (error) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title} {!loading && <Badge>{nodes.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            {[...Array(limit)].map((_, index) => (
              <div key={index} className="flex items-center gap-2 mb-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </>
        ) : nodes.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No {nodeLabel} nodes found
          </p>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {nodes.slice(0, limit).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleNodeClick(node.id)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {node.properties.name ? node.properties.name[0].toUpperCase() : '#'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {node.properties.name || `${nodeLabel}-${node.id}`}
                    </p>
                    {node.properties.description && (
                      <p className="text-muted-foreground text-xs truncate max-w-56">
                        {node.properties.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs"
                    style={getBadgeStyle()}
                  >
                    {node.label}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 