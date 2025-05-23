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