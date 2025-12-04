# Deploying to GitHub Pages

This project is pre-configured for GitHub Pages deployment.

## Quick Start

1. **Update vite.config.ts**:
   ```typescript
   base: "/your-repo-name/",  // Replace with your actual repository name
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

3. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Click Settings > Pages
   - Under "Build and deployment", select "Deploy from a branch"
   - Wait for the GitHub Action to complete (check the Actions tab)
   - Select `gh-pages` branch and `/ (root)` folder
   - Click Save

Your site will be available at `https://username.github.io/repo-name/`

## Troubleshooting

- **404 errors**: Check that `base` in `vite.config.ts` matches your repository name
- **Blank page**: Check the Actions tab to ensure the build succeeded
- **Changes not appearing**: Wait a few minutes for GitHub Pages to update
