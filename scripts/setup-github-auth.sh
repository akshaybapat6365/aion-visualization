#!/bin/bash

echo "=== GitHub MCP Server Setup ==="
echo ""
echo "This script will help you securely set up GitHub authentication."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Installing..."
    if command -v brew &> /dev/null; then
        brew install gh
    else
        echo "Please install GitHub CLI manually from: https://cli.github.com/"
        exit 1
    fi
fi

# Authenticate with GitHub
echo "Authenticating with GitHub..."
gh auth login

# Check authentication status
if gh auth status &> /dev/null; then
    echo "✅ Successfully authenticated with GitHub!"
    echo ""
    
    # Create pull request
    echo "Creating pull request..."
    cd /Users/akshaybapat/aion-visualization
    
    gh pr create \
        --title "Enhanced Chapter Navigation System for Aion Visualization" \
        --body-file PR_DESCRIPTION.md \
        --base main \
        --head feature/enhanced-navigation
    
    echo ""
    echo "✅ Pull request created successfully!"
else
    echo "❌ GitHub authentication failed. Please try again."
    exit 1
fi

echo ""
echo "=== Next Steps ==="
echo "1. The GitHub MCP server configuration has been added to ~/.vscode/mcp.json"
echo "2. When prompted in VS Code, create a new Personal Access Token with appropriate permissions"
echo "3. The MCP server will handle all GitHub operations securely"
echo ""
echo "To create a new token, visit: https://github.com/settings/tokens/new"
echo "Recommended permissions: repo, workflow, read:org"