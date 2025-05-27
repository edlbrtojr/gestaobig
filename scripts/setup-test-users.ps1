# Neo4j Test Users Setup Script
# This script creates test users with different privileges in Neo4j

Write-Host "Setting up Neo4j test users for privilege testing..." -ForegroundColor Green

# Define the path to the create-test-users.js script
$scriptPath = Join-Path $PSScriptRoot "create-test-users.js"

# Check if the script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: Cannot find create-test-users.js script at path: $scriptPath" -ForegroundColor Red
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
Write-Host "Running create-test-users.js script..." -ForegroundColor Yellow
node $scriptPath

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create test users. Please check Neo4j connection and permissions." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Test users created successfully!" -ForegroundColor Green
Write-Host "You can now switch between different users with varying permission levels in the application UI." -ForegroundColor Green
Write-Host ""
Write-Host "Available test users:" -ForegroundColor Cyan
Write-Host "- admin_user: Administrator with full privileges" -ForegroundColor White
Write-Host "- editor_user: Editor with data modification privileges" -ForegroundColor White
Write-Host "- analyst_user: Analyst with reading and publishing privileges" -ForegroundColor White
Write-Host "- reader_user: Reader with read-only privileges" -ForegroundColor White
Write-Host "- limited_user: Limited user with minimal access" -ForegroundColor White
Write-Host ""
Write-Host "Test these users by selecting the user switcher in the top-right corner of the application." -ForegroundColor Yellow 