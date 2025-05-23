// Copy and paste this code into your browser console while on the admin page
// to check what's stored in localStorage

(function checkLocalStorage() {
  console.log('Checking localStorage for graphSchema:');
  
  const storedSchema = localStorage.getItem('graphSchema');
  
  if (!storedSchema) {
    console.log('No graphSchema found in localStorage!');
    return;
  }
  
  try {
    const schema = JSON.parse(storedSchema);
    
    console.log('Schema structure in localStorage:');
    console.log('- nodeTypes:', Object.keys(schema.nodeTypes || {}).length, 'types');
    console.log('- relationshipTypes:', Object.keys(schema.relationshipTypes || {}).length, 'types');
    
    // Print relationship types
    console.log('\nRelationship Types in localStorage:');
    if (schema.relationshipTypes && Object.keys(schema.relationshipTypes).length > 0) {
      Object.entries(schema.relationshipTypes).forEach(([key, rel]) => {
        console.log(`- ${key}:`);
        console.log(`  - Description: ${rel.description}`);
        console.log(`  - Source node types:`, rel.sourceNodeTypes);
        console.log(`  - Target node types:`, rel.targetNodeTypes);
        console.log(`  - Bidirectional:`, rel.bidirectional ? 'Yes' : 'No');
      });
    } else {
      console.log('No relationship types defined in localStorage schema.');
    }
  } catch (error) {
    console.error('Error parsing schema from localStorage:', error);
  }
})(); 