# Setting Up GitHub Pages

To make your visualization accessible on the web via GitHub Pages:

## Step 1: Enable GitHub Pages in Repository Settings

1. Go to your repository settings: https://github.com/akshaybapat6365/aion-visualization/settings
2. In the left sidebar, click on "Pages"
3. Under "Build and deployment" > "Source", select "Deploy from a branch"
4. Under "Branch", select "main" and "/ (root)" from the dropdown menus
5. Click "Save"

## Step 2: Wait for Deployment

- GitHub will now start building your site
- This typically takes 1-3 minutes
- You'll see a message at the top of the GitHub Pages settings page once it's published
- The message will include the URL of your published site (typically https://akshaybapat6365.github.io/aion-visualization/)

## Step 3: Verify Your Site

Visit https://akshaybapat6365.github.io/aion-visualization/ to ensure your visualization is working correctly.

## Troubleshooting

If your site doesn't appear:
- Check that your repository contains files in the root directory (not in a subdirectory)
- Ensure index.html exists in the root of your repository
- Check for any error messages in the "Actions" tab of your repository
- Wait a few more minutes as GitHub Pages can sometimes take time to update

## Making Updates

Any changes pushed to the main branch will automatically trigger a rebuild of your GitHub Pages site.
