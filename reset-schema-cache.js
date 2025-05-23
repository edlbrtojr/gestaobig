// Copy and paste this code into your browser console to reset the schema cache
// and force a reload from the database

(function resetSchemaCache() {
  console.log('Resetting schema cache in localStorage...');
  
  try {
    // Clear the schema from localStorage
    localStorage.removeItem('graphSchema');
    console.log('✅ Schema cache cleared from localStorage!');
    
    // Force a reload of the page to get fresh data from the database
    console.log('Reloading the page to fetch fresh schema from database...');
    window.location.reload();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
})(); 