# Pull Request Creation Instructions

## Steps to Create the PR

1. First, ensure your local changes are pushed:
   ```bash
   git push origin launch-preparations
   ```

2. Create the PR using GitHub CLI:
   ```bash
   gh pr create \
     --title "Launch preparations: Essential fixes and cleanup" \
     --body "## Summary
   - Stripped down to bare essentials per user feedback
   - Fixed critical navigation issues
   - Removed 4000+ lines of extravagant features
   - Focus on core functionality that works

   ## Changes
   - Fixed keyboard navigation paths to use correct \`standard/chapter-X.html\` format
   - Fixed all chapter links in chapters index from \`chapter1.html\` to \`standard/chapter-1.html\`
   - Removed non-existent script imports
   - Removed complex features (analytics, A11y enhancements, PWA prompts)
   - Added simple deployment documentation
   - Created test page for core functionality

   ## Testing
   - All chapter navigation works
   - Keyboard shortcuts functional (1-9 for chapters, Esc for home)
   - Service worker and offline mode operational
   - Clean, minimalist design with fast load times

   Ready for production deployment." \
     --base main \
     --head launch-preparations
   ```

3. Alternative: Create via GitHub Web UI
   - Go to: https://github.com/akshaybapat6365/aion-visualization
   - Click "Pull requests" tab
   - Click "New pull request"
   - Select base: `main` and compare: `launch-preparations`
   - Use the title and body content provided above

## Expected PR URL
Once created, the PR URL will be in the format:
`https://github.com/akshaybapat6365/aion-visualization/pull/[PR_NUMBER]`