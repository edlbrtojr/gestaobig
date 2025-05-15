export interface NodeProperties {
  name: string;
  [key: string]: any;
}

export interface Neo4jId {
  low: number;
  high: number;
}

export interface Node {
  id: Neo4jId | number;
  label: string;
  properties: NodeProperties;
}

export interface RelationshipProperties {
  [key: string]: any;
}

export interface Relationship {
  id: Neo4jId | number;
  source: Neo4jId | number;
  target: Neo4jId | number;
  type: string;
  properties: RelationshipProperties;
}

export interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

// D3 force simulation compatible types
export interface D3Node extends d3.SimulationNodeDatum {
  id: number;
  label: string;
  properties: NodeProperties;
  x?: number;
  y?: number;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: number;
  source: D3Node | number;
  target: D3Node | number;
  type: string;
  properties: RelationshipProperties;
}
