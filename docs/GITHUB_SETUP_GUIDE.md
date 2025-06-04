# GitHub Setup Guide for Aion Visualization

## 🔐 Important Security Notice
The personal access token you shared earlier should be revoked immediately:
1. Go to https://github.com/settings/tokens
2. Find and delete the exposed token
3. Create a new token following the secure process below

## 🚀 Secure Setup Process

### Option 1: Using GitHub CLI (Recommended)

1. **Run the setup script**:
   ```bash
   cd /Users/akshaybapat/aion-visualization
   ./scripts/setup-github-auth.sh
   ```

2. **Follow the prompts** to authenticate with GitHub using your browser

3. The script will automatically create your pull request once authenticated

### Option 2: Manual GitHub CLI Setup

1. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```
   - Choose "GitHub.com"
   - Select "HTTPS"
   - Choose "Login with a web browser"
   - Follow the browser prompts

2. **Create the pull request**:
   ```bash
   cd /Users/akshaybapat/aion-visualization
   gh pr create \
     --title "Enhanced Chapter Navigation System for Aion Visualization" \
     --body-file PR_DESCRIPTION.md \
     --base main \
     --head feature/enhanced-navigation
   ```

### Option 3: Using GitHub MCP Server in VS Code

The MCP (Model Context Protocol) server is now configured for VS Code:

1. **Location**: `~/.vscode/mcp.json`
2. **When VS Code prompts for a token**, create one at: https://github.com/settings/tokens/new
3. **Required permissions**:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `read:org` (Read org and team membership)

### 🎨 What's Been Created

Your enhanced Aion visualization now includes:

1. **Chapter Navigation System** (`chapters.html`)
   - All 14 chapters with unique SVG symbols
   - Progress tracking
   - Beautiful animations

2. **Chapter 1 Implementation** (`chapter1.html`)
   - Interactive consciousness field
   - Ego-Self axis visualization
   - Historical timeline
   - Reflection exercises

3. **Supporting Files**:
   - `chapter-navigation.css` - Stunning visual styles
   - `chapter-navigation.js` - Interactive functionality
   - `chapter1.js` - Chapter 1 visualizations
   - `chapter-styles.css` - Shared chapter styles

## 📱 Testing Your Changes

1. **Local Testing**:
   ```bash
   cd /Users/akshaybapat/aion-visualization
   open index.html
   ```

2. **Navigate to Chapters** in the top navigation

3. **Explore Chapter 1** to see the interactive visualizations

## 🔄 Next Steps

Once your PR is merged:

1. Continue implementing the remaining 13 chapters
2. Add more complex visualizations (alchemical processes, Gnostic symbols)
3. Build the personal journey tracking system
4. Create interconnected data visualizations

## 📞 Need Help?

- GitHub CLI docs: https://cli.github.com/manual/
- MCP docs: https://modelcontextprotocol.io/
- GitHub tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

Remember: Never share your personal access tokens in text or code!