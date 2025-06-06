const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(process.cwd(), '.env.local');

// Template with placeholders instead of hardcoded values
const ENV_TEMPLATE = `# Authentication
NEXTAUTH_SECRET=YOUR_SECURE_SECRET_HERE
NEXTAUTH_URL=http://localhost:3000

# Azure AD / Microsoft Entra ID
AZURE_AD_CLIENT_ID=YOUR_CLIENT_ID_HERE
AZURE_AD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
AZURE_AD_TENANT_ID=YOUR_TENANT_ID_HERE
USE_MSGRAPH_API=true

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=YOUR_NEO4J_PASSWORD_HERE
`;

console.log('===== INSTRUÇÕES PARA CONFIGURAÇÃO DO AMBIENTE =====');
console.log('Para que a autenticação funcione corretamente, você precisa:');
console.log('');
console.log('1. Criar um arquivo .env.local na raiz do projeto');
console.log('2. Adicionar as seguintes variáveis de ambiente:');
console.log('');
console.log(ENV_TEMPLATE);
console.log('');
console.log('3. Substituir os valores YOUR_XXX_HERE pelos valores reais');
console.log('4. Para gerar um NEXTAUTH_SECRET seguro, você pode usar:');
console.log('   - node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
console.log('');
console.log('Não use valores hardcoded em produção!');
console.log('===============================================');

try {
  // Check if file already exists
  if (fs.existsSync(ENV_PATH)) {
    console.log(`Arquivo .env.local já existe em ${ENV_PATH}`);
    console.log('Verifique se todas as variáveis necessárias estão configuradas corretamente.');
  } else {
    // Ask if the user wants to create a template file
    console.log(`Arquivo .env.local não encontrado em ${ENV_PATH}`);
    console.log('Para criar um arquivo de modelo, execute:');
    console.log('node -e "require(\'fs\').writeFileSync(\'.env.local\', require(\'fs\').readFileSync(\'env.template\', \'utf8\'))"');
    
    // Create template file for reference
    fs.writeFileSync('env.template', ENV_TEMPLATE);
    console.log('Arquivo de modelo env.template criado para referência.');
  }
} catch (error) {
  console.error('Erro:', error);
} 