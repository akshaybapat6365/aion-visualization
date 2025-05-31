#!/bin/bash

echo "=== Creating Pull Request for Aion Visualization ==="
echo ""

# Check if we're in the right directory
if [ ! -f "PR_DESCRIPTION.md" ]; then
    echo "Error: PR_DESCRIPTION.md not found. Please run this from the aion-visualization directory."
    exit 1
fi

# Check GitHub CLI authentication
echo "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "You need to authenticate first. Running: gh auth login"
    gh auth login
fi

# Create the pull request
echo ""
echo "Creating pull request..."
gh pr create \
    --title "Enhanced Chapter Navigation System for Aion Visualization" \
    --body-file PR_DESCRIPTION.md \
    --base main \
    --head feature/enhanced-navigation

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Pull request created successfully!"
    echo ""
    echo "You can view it with: gh pr view --web"
else
    echo ""
    echo "❌ Failed to create pull request. Please check the error message above."
fi