# 🍳 Pantry Chef

**What can I cook with this?** Add the ingredients you have at home and Pantry Chef finds recipes you can actually make — even if it's just bread with tomato.

🔗 **Live demo**: https://vicmescan.github.io/pantry-chef/

## Features

- **Ingredient-based search** — powered by [TheMealDB](https://www.themealdb.com/api.php), a free recipe API.
- **Smart matching** — recipes are ranked by how few ingredients you're *missing*, so simple recipes you can make right now show up first, even if they only use one or two of the ingredients you listed.
- **Autocomplete with fuzzy suggestions** — type "oil" and get matches like "extra virgin olive oil", not just things that start with "oil". Matching text is highlighted.
- **Persistent pantry** — your ingredient list is saved in `localStorage`, so it survives page reloads.
- **Missing ingredients breakdown** — for each recipe, see exactly what you're missing, with links to the original recipe, a video, or a Google search.
- **In-memory request caching** — repeated searches reuse previously fetched data instead of hitting the API again.

## Tech stack

- [React 18](https://react.dev/)
- [Vite](https://vite.dev/)
- [TheMealDB API](https://www.themealdb.com/api.php) (free tier)

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173/pantry-chef/`).

### Other scripts

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build locally
npm run lint     # run ESLint
npm run deploy   # build and publish dist/ to the gh-pages branch
```

## How the search works

1. For each ingredient you add, the app queries TheMealDB for recipes containing it.
2. All matching recipes are pooled and ranked by how many of your ingredients they use.
3. The full ingredient list of the top candidates is fetched to calculate exactly what's missing.
4. Results are sorted so recipes with **zero missing ingredients** appear first, then by fewest missing.

## Deployment

The app is deployed to GitHub Pages from the `gh-pages` branch via the [`gh-pages`](https://www.npmjs.com/package/gh-pages) package. The Vite `base` path in `vite.config.js` is set to `/pantry-chef/` to match the project page URL.
