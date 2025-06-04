# Setting Up GitHub Pages

To make your visualization accessible on the web via GitHub Pages:

## Step 1: Enable GitHub Pages in Repository Settings

1. Go to your repository settings: <https://github.com/akshaybapat6365/aion-visualization/settings>
2. In the left sidebar, click on **"Pages"**
3. Under **"Build and deployment" → "Source"**, choose **"GitHub Actions"**
4. Click **"Save"**. This tells GitHub Pages to use the `deploy-pages.yml` workflow in `.github/workflows`.

## Step 2: Trigger and Monitor the Workflow

- Push a commit or use the **Actions → Deploy to GitHub Pages** workflow to trigger a run.
- The workflow uploads everything from the `src/` directory and publishes it to GitHub Pages.
- Once the run completes (usually within a few minutes) you'll see a green check mark and the deployment URL.

## Step 3: Verify Your Site

Once the workflow has finished, visit <https://akshaybapat6365.github.io/aion-visualization/> to ensure your visualization is working correctly.

## Troubleshooting

If your site doesn't appear:
- Ensure `src/index.html` exists and is being uploaded by the workflow
- Check for any error messages in the **Actions** tab of your repository
- Wait a few more minutes as GitHub Pages can sometimes take time to update

## Making Updates

Any changes pushed to the `main` branch will automatically trigger the `Deploy to GitHub Pages` workflow and update your site.
