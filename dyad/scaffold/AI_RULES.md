# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

## GitHub Pages Deployment

When the user mentions deploying to GitHub Pages or asks about deployment:

1. **Update vite.config.ts**: Set the `base` property to match the repository name.
   - If the repo is named "my-portfolio", set `base: "/my-portfolio/"`
   - For user/org pages (username.github.io), use `base: "/"`

2. **Verify Workflow Exists**: The `.github/workflows/deploy.yml` file should already exist in the project (it's included in the scaffold).

3. **Instruct User on GitHub Settings**:
   - After pushing code, go to repository Settings > Pages
   - Set Source to "Deploy from a branch"
   - Select the `gh-pages` branch (appears after first workflow run)
   - Select `/ (root)` as the folder

4. **Common Issues**:
   - 404 errors: Usually means `base` in vite.config.ts is incorrect
   - Blank page: Workflow might not have run successfully, check Actions tab
