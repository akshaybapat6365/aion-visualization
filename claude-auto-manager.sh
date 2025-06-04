#!/bin/bash

# Claude Auto Manager - Full Automation Mode
echo "🤖 Starting Claude Auto Manager"

# Start MCP servers
docker-compose -f docker-compose.mcp.yml up -d

# Configure Claude for full automation
claude config set auto-review true
claude config set auto-merge true
claude config set auto-fix true
claude config set auto-deploy true

# Enable Claude to manage the repo automatically
claude /auto-mode enable

echo "✅ Claude Auto Manager active - Full automation enabled"