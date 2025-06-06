// Script para corrigir problemas com o schema de propriedades

// 1. Verificar e corrigir o problema de parâmetros faltantes (defaultValue e options)
// Atualizando todas as propriedades para garantir que os campos defaultValue e options estejam definidos corretamente

// Definir defaultValue para null em todas as propriedades que não têm este campo
MATCH (prop:_SchemaProperty)
WHERE prop.defaultValue IS NULL
SET prop.defaultValue = null
RETURN count(prop) AS fixedDefaultValueProps;

// Definir options para null em todas as propriedades que não têm este campo
MATCH (prop:_SchemaProperty)
WHERE prop.options IS NULL AND prop.type <> 'enum'
SET prop.options = null
RETURN count(prop) AS fixedOptionsProps;

// Garantir que propriedades do tipo enum tenham um array de options
MATCH (prop:_SchemaProperty)
WHERE prop.type = 'enum' AND prop.options IS NULL
SET prop.options = ['Valor Padrão']
RETURN count(prop) AS fixedEnumProps;

// 2. Corrigir possíveis problemas com tipos de dados nos parâmetros
// Garantir que required seja booleano
MATCH (prop:_SchemaProperty)
WHERE prop.required IS NOT NULL AND prop.required <> true AND prop.required <> false
SET prop.required = CASE 
  WHEN prop.required = 'true' THEN true 
  WHEN prop.required = 'false' THEN false
  ELSE false END
RETURN count(prop) AS fixedRequiredProps;

// 3. Garantir que todas as propriedades tenham um nodeType ou relType
MATCH (prop:_SchemaProperty)
WHERE prop.nodeType IS NULL AND prop.relType IS NULL
WITH prop
MATCH (node:_NodeLabelSchema)-[:HAS_PROPERTY]->(prop)
SET prop.nodeType = node.name
RETURN count(prop) AS fixedNodeTypeProps;

MATCH (prop:_SchemaProperty)
WHERE prop.nodeType IS NULL AND prop.relType IS NULL
WITH prop
MATCH (rel:_RelationshipTypeSchema)-[:HAS_PROPERTY]->(prop)
SET prop.relType = rel.name
RETURN count(prop) AS fixedRelTypeProps;

// 4. Corrigir possíveis problemas de formato em arrays de options
// Usando abordagem alternativa sem apoc para verificar o tipo de dado
MATCH (prop:_SchemaProperty)
WHERE prop.type = 'enum' AND prop.options IS NOT NULL 
WITH prop, 
  CASE 
    WHEN prop.options IS NULL THEN false
    WHEN size([x IN [prop.options] WHERE true]) > 0 THEN true
    ELSE false
  END as isArray
WHERE NOT isArray
SET prop.options = CASE 
  WHEN prop.options IS NULL THEN ['Valor Padrão']
  WHEN prop.options = '' THEN ['Valor Padrão']
  ELSE [prop.options] END
RETURN count(prop) AS fixedOptionFormatProps;

// 5. Atualizar o nó de configuração do schema para refletir a correção
MATCH (config:_SchemaConfig {name: "systemSchema"})
SET config.updatedAt = datetime(),
    config.version = "1.1.1",
    config.status = "fixed"
RETURN config.name, config.version, config.updatedAt; 