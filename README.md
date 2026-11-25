# Danil Abramitov — Portfolio

My personal resume website: client service, customer support, computer skills, and websites built with AI.

Plain HTML, CSS and JavaScript. You edit the files directly; nothing to install.

## Run locally

```bash
node .claude/serve.js
```

Then open http://localhost:5173.

## Deploy

Vercel deploys every push to `main`. `vercel.json` tells it to run `node build.js`, which makes a smaller copy of the site in `dist/` (CSS and JavaScript inside the page, security rules added). To try that copy yourself: `node build.js`.
