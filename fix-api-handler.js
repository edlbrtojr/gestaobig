// Add this script to the browser console to test the API behavior

(async function testAPIAccess() {
  console.log('Testing schema API access...');
  
  try {
    // 1. First, get the schema from the API
    console.log('Fetching schema from API...');
    const response = await fetch('/api/schema');
    
    if (!response.ok) {
      console.error(`API returned ${response.status}: ${response.statusText}`);
      console.log('Possible issues with API endpoint. Check server logs or network tab.');
      return;
    }
    
    const schema = await response.json();
    
    // 2. Check if the schema has both nodeTypes and relationshipTypes
    console.log('Schema structure from API:');
    console.log('- nodeTypes:', Object.keys(schema.nodeTypes || {}).length, 'types');
    console.log('- relationshipTypes:', Object.keys(schema.relationshipTypes || {}).length, 'types');
    
    // 3. Test saving a schema with explicitly defined relationship types
    const testSchema = {
      nodeTypes: schema.nodeTypes || {},
      relationshipTypes: {
        TEST_RELATIONSHIP: {
          type: "TEST_RELATIONSHIP",
          description: "Test relationship to verify API saving",
          sourceNodeTypes: ["Risco"],
          targetNodeTypes: ["PlanoDeAcao"],
          bidirectional: false
        },
        ...schema.relationshipTypes
      }
    };
    
    console.log('Adding test relationship and saving back to API...');
    const saveResponse = await fetch('/api/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSchema),
    });
    
    if (!saveResponse.ok) {
      console.error(`Error saving schema: ${saveResponse.status}: ${saveResponse.statusText}`);
      console.log('Possible issues with API write endpoint.');
      return;
    }
    
    console.log('✅ Test schema saved successfully!');
    console.log('Fetching schema again to verify relationships were saved...');
    
    // 4. Verify the schema was saved with relationships
    const verifyResponse = await fetch('/api/schema');
    const verifiedSchema = await verifyResponse.json();
    
    console.log('Updated schema structure:');
    console.log('- nodeTypes:', Object.keys(verifiedSchema.nodeTypes || {}).length, 'types');
    console.log('- relationshipTypes:', Object.keys(verifiedSchema.relationshipTypes || {}).length, 'types');
    
    if (verifiedSchema.relationshipTypes?.TEST_RELATIONSHIP) {
      console.log('✅ Test relationship found in the saved schema!');
      // Clean up test data
      delete verifiedSchema.relationshipTypes.TEST_RELATIONSHIP;
      await fetch('/api/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifiedSchema),
      });
      console.log('Test relationship cleaned up.');
    } else {
      console.log('❌ Test relationship NOT found in the saved schema!');
      console.log('This indicates an issue with how relationship types are being saved or retrieved.');
    }
    
    // 5. Check localStorage vs API
    const localSchema = localStorage.getItem('graphSchema') 
      ? JSON.parse(localStorage.getItem('graphSchema')) 
      : null;
    
    if (localSchema) {
      console.log('\nComparing localStorage schema with API schema:');
      console.log('localStorage nodeTypes:', Object.keys(localSchema.nodeTypes || {}).length);
      console.log('API nodeTypes:', Object.keys(verifiedSchema.nodeTypes || {}).length);
      console.log('localStorage relationshipTypes:', Object.keys(localSchema.relationshipTypes || {}).length);
      console.log('API relationshipTypes:', Object.keys(verifiedSchema.relationshipTypes || {}).length);
      
      if (Object.keys(localSchema.relationshipTypes || {}).length > 
          Object.keys(verifiedSchema.relationshipTypes || {}).length) {
        console.log('❗ localStorage has more relationship types than the API schema!');
        console.log('This might be causing your issue - localStorage has overridden API data.');
      }
      
      if (Object.keys(localSchema.relationshipTypes || {}).length === 0 &&
          Object.keys(verifiedSchema.relationshipTypes || {}).length > 0) {
        console.log('❗ localStorage has NO relationship types but API has them!');
        console.log('Try clearing localStorage or updating it with API data.');
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
})(); 

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretório base para arquivos da API
const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');

// Padrão para encontrar a inicialização do driver sem autenticação
const OLD_DRIVER_PATTERN_1 = /const\s+driver\s*=\s*neo4j\.driver\(\s*process\.env\.NEO4J_URI\s*\|\|\s*"bolt:\/\/localhost:7687"\s*\);/g;
const OLD_DRIVER_PATTERN_2 = /const\s+driver\s*=\s*neo4j\.driver\(\s*process\.env\.NEO4J_URI\s*\|\|\s*"bolt:\/\/localhost:7687"\s*,\s*process\.env\.NEO4J_USER\s*&&\s*process\.env\.NEO4J_PASSWORD\s*\?\s*neo4j\.auth\.basic\(process\.env\.NEO4J_USER,\s*process\.env\.NEO4J_PASSWORD\)\s*:\s*undefined\s*\);/g;

// Novo código para substituir
const NEW_DRIVER_CODE = `// Neo4j connection
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));`;

// Função para processar um arquivo
function processFile(filePath) {
  console.log(`Processando arquivo: ${filePath}`);
  
  try {
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se o arquivo contém inicialização do driver Neo4j
    const hasOldPattern1 = OLD_DRIVER_PATTERN_1.test(content);
    // Resetar o RegExp para a próxima verificação
    OLD_DRIVER_PATTERN_1.lastIndex = 0;
    
    const hasOldPattern2 = OLD_DRIVER_PATTERN_2.test(content);
    // Resetar o RegExp para a próxima verificação
    OLD_DRIVER_PATTERN_2.lastIndex = 0;
    
    if (hasOldPattern1) {
      console.log(`  - Encontrado padrão 1 no arquivo ${filePath}`);
      content = content.replace(OLD_DRIVER_PATTERN_1, NEW_DRIVER_CODE);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  - Arquivo atualizado: ${filePath}`);
    } else if (hasOldPattern2) {
      console.log(`  - Encontrado padrão 2 no arquivo ${filePath}`);
      content = content.replace(OLD_DRIVER_PATTERN_2, NEW_DRIVER_CODE);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  - Arquivo atualizado: ${filePath}`);
    } else {
      console.log(`  - Nenhum padrão encontrado no arquivo ${filePath}`);
    }
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${filePath}:`, error);
  }
}

// Função para percorrer diretórios recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
      processFile(filePath);
    }
  }
}

// Iniciar o processamento
console.log('Iniciando atualização dos arquivos de API...');
processDirectory(API_DIR);
processDirectory(SCRIPTS_DIR);
console.log('Processo concluído!');

// Instruções finais
console.log('\nPara verificar se todos os arquivos foram atualizados corretamente, execute:');
console.log('grep -r "neo4j\\.driver(" src/app/api'); 