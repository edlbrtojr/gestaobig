# Neo4j Permissions Schema Setup Script
# This script sets up the node visibility permissions schema in Neo4j

Write-Host "Setting up Neo4j node visibility permissions schema..." -ForegroundColor Green

# Define the path to the script
$scriptPath = Join-Path $PSScriptRoot "create-permission-schema.js"

# Check if the script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: Cannot find create-permission-schema.js script at path: $scriptPath" -ForegroundColor Red
    exit 1
}

# Get Neo4j connection details from environment or use defaults
$NEO4J_URI = if ($env:NEO4J_URI) { $env:NEO4J_URI } else { "bolt://localhost:7687" }
$NEO4J_USERNAME = if ($env:NEO4J_USERNAME) { $env:NEO4J_USERNAME } else { "neo4j" }
$NEO4J_PASSWORD = if ($env:NEO4J_PASSWORD) { $env:NEO4J_PASSWORD } else { "3d1Jun1or" }

Write-Host "Using Neo4j connection:" -ForegroundColor Cyan
Write-Host "URI: $NEO4J_URI" -ForegroundColor Cyan
Write-Host "Username: $NEO4J_USERNAME" -ForegroundColor Cyan
Write-Host "Password: $('*' * $NEO4J_PASSWORD.Length)" -ForegroundColor Cyan

# Set environment variables for the script
$env:NEO4J_URI = $NEO4J_URI
$env:NEO4J_USERNAME = $NEO4J_USERNAME
$env:NEO4J_PASSWORD = $NEO4J_PASSWORD

# Run the script with Node.js
Write-Host "Running node permission schema setup script..." -ForegroundColor Yellow
node $scriptPath

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set up permissions schema. Please check Neo4j connection and permissions." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Permission schema created successfully!" -ForegroundColor Green
Write-Host "You can now manage node visibility in the admin panel." -ForegroundColor Green 