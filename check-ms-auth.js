// Simple script to check if Microsoft authentication environment variables are set
require('dotenv').config();

console.log('Checking Microsoft Authentication Environment Variables...');

const requiredVars = [
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'AZURE_AD_TENANT_ID',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.log('\nPlease add these variables to your .env file.');
  
  if (missingVars.includes('NEXTAUTH_SECRET')) {
    console.log('\nYou can generate a NEXTAUTH_SECRET with:');
    console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
} else {
  console.log('✅ All required Microsoft Authentication variables are set!');
  
  console.log('\nCurrent values:');
  console.log(`AZURE_AD_CLIENT_ID: ${process.env.AZURE_AD_CLIENT_ID.substring(0, 5)}...`);
  console.log(`AZURE_AD_CLIENT_SECRET: ${process.env.AZURE_AD_CLIENT_SECRET.substring(0, 3)}...`);
  console.log(`AZURE_AD_TENANT_ID: ${process.env.AZURE_AD_TENANT_ID.substring(0, 5)}...`);
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET.substring(0, 5)}...`);
} 