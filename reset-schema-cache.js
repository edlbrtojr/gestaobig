// Script to reset schema cache
const fs = require('fs');
const path = require('path');

// Import the schema.ts file manually as it's TypeScript
const schemaPath = path.join(__dirname, 'src', 'lib', 'schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

async function resetSchemaCache() {
  try {
    console.log('Resetting schema cache...');
    
    // Extract DEFAULT_SCHEMA from the file content
    const defaultSchemaMatch = schemaContent.match(/const DEFAULT_SCHEMA: GraphSchema = ({[\s\S]*?});/);
    
    if (!defaultSchemaMatch) {
      console.error('Could not find DEFAULT_SCHEMA in schema.ts');
      return;
    }
    
    // Extract and parse the schema object
    let schemaString = defaultSchemaMatch[1];
    
    // Convert TypeScript syntax to valid JSON where needed
    schemaString = schemaString.replace(/\/\/.*$/gm, ''); // Remove comments
    
    // Make sure public directory exists
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Save to a JavaScript file that exports the schema
    console.log('Creating schema file...');
    fs.writeFileSync(
      path.join(__dirname, 'public', 'defaultSchema.js'),
      `// Generated from schema.ts DEFAULT_SCHEMA\nmodule.exports = ${schemaString}`
    );
    
    console.log('Schema cache reset successful. Schema saved to public/defaultSchema.js');
  } catch (error) {
    console.error('Error resetting schema cache:', error);
  }
}

resetSchemaCache(); 