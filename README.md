# Nexus Tools

**Last updated:** 2026-08-30

Nexus Tools is a standalone, client-only website. Its approved design uses a charcoal background, expanded navigation, colorful category tiles and four-column tool cards. It includes Thai/English, light/dark themes, search, category filtering, sorting and device-local favorites.

## Architecture

- `index.html` → `src/main.tsx` is an independent entry point.
- `vite.config.ts` builds the standalone application to `dist/`.
- `src/catalog.ts` owns the typed catalogue and filtering. `store.ts` owns validated device-local preferences through Zustand persist.
- Components collect input and display results. `services/` owns conversion, validation, invoice calculations and export. `hooks/useToolRunner.ts` owns cancellation, errors and download URL cleanup.
- PDF work runs in a dedicated Web Worker, terminated on cancel, close, completion or a two-minute timeout. Other file tools run on demand in the browser.
- Shared language, modal accessibility and download helpers live in `src/shared/` so the project has no runtime dependency on the Nexus application.
- The Tools entry does not initialize Nexus's database, authentication, sync, monitoring or PWA service worker. File contents and invoice data are not persisted or uploaded. Preferences are local to the deployment origin.

## Implemented tools and limits

| Tool | Behavior | Limits |
|---|---|---|
| Merge PDF | Reorder selected PDFs and download one merged document | At least 2, at most 20 files; 50 MB total; 500 pages |
| Split PDF | Export selected pages into one new PDF, preserving input order and removing duplicate selections | One PDF; ranges such as `3, 1-2`; same size/page limits |
| Image Compressor | Set JPEG/WebP quality and maximum width; PNG also supported | JPEG/PNG/WebP input, 20 MB, 24 megapixels; PNG ignores quality |
| Image Converter | Export JPEG, PNG or WebP with proportional resizing | No upscaling; JPEG flattens transparency to white; animation/metadata discarded |
| QR Code | Download scalable SVG, including a white quiet zone | Nonblank text, up to 1,000 UTF-8 bytes |
| Unit Converter | Length, weight and temperature | Finite values, absolute-zero validation; 12 significant digits |
| Invoice Generator | Download escaped, print-ready HTML; open file and use browser Print → Save as PDF | Thai supported; THB/USD/EUR; 30 lines; integer quantities; two-decimal prices; configurable tax |
| Word Counter | Count words, grapheme characters, paragraphs and UTF-8 bytes; download text | 100,000 input code units; browser Intl.Segmenter defines language-aware word boundaries |

Encrypted/protected PDFs are rejected. PDF form appearances are flattened; document-level bookmarks, digital signatures and interactive form behavior are not retained. Image output is not guaranteed smaller; the UI reports both sizes. Invoices are not certified tax invoices. No external currency rates or financial account data are used.

## Development and validation

From the repository root:

```sh
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

The development URL is `http://127.0.0.1:5174/`. E2E tests use the compiled site on port 4174; rebuild before running them.

Validation passed 19 unit/hook checks and 7 Chromium end-to-end workflows covering all eight tools, actual downloaded PDF/image/QR/text/invoice files, input recovery, favorites, bilingual controls, themes, keyboard focus and mobile navigation. `npm audit` reports no known vulnerabilities in this standalone dependency tree.

## Vercel deployment

The Vercel project is **nexus-tools**, separate from **nexus**. `vercel.json` provides the build settings, SPA fallback and security headers.

Production: [nexus-tools-chi.vercel.app](https://nexus-tools-chi.vercel.app). The seven Chromium E2E workflows also passed against the deployed site, including PDF worker and file downloads under the production Content Security Policy.

The local project link is stored in ignored `.vercel/project.json`. To set up a new machine, run `npx vercel link` from this directory and select **nexus-tools**. Do not link it to **nexus**.

```sh
npm run deploy
```

The script validates the linked Vercel project name and deploys this project to production. This manual command bypasses CI; prefer the GitHub workflow for normal releases.

## GitHub and automated deployment

Repository: `Piecez2548/Nexus-Tools` (private).

`.github/workflows/ci.yml` checks pull requests and pushes to `main` with Node.js 22, `npm ci`, ESLint, TypeScript/production build, unit tests and Chromium E2E tests. Actions are pinned to commit hashes and receive read-only repository access.

Only a successful validation on `main` can start the production job, and the repository variable `PRODUCTION_DEPLOY_ENABLED` must be `true`. Keep this switch disabled until the token is configured. That job sends the same checked-out commit using Vercel CLI 59.10.0 to the existing Nexus Tools project, where Vercel builds it using the committed lockfile and configuration, then runs the seven E2E workflows against production. Pull requests never receive the deployment token. Deployments on the same branch are serialized. Failed browser traces are retained for seven days. Direct deployment avoids the team-level lookup required by `vercel pull`, which is unavailable to a project-scoped token.

The repository secret `VERCEL_TOKEN` must contain a token scoped to project `prj_bTrQ2QqhCPQ1yGxw99tKFkJkyaat`. Never commit it or paste it into logs. Vercel Git auto-deployment is not used; GitHub Actions owns deployment so failed validation cannot trigger a release. Rotate the token before its expiry and replace the GitHub secret.

Configured on 2026-08-30: `VERCEL_TOKEN` is stored in GitHub Actions Secrets and `PRODUCTION_DEPLOY_ENABLED=true`. The token is scoped only to `nexus-tools` and expires on **2027-02-26**. No temporary team-wide token was needed. Rotate it in Vercel Account Settings → Tokens by selecting the team, then the `nexus-tools` project, and update the existing GitHub secret before expiry.

Production test failure marks the workflow failed but does not automatically roll back a completed deployment. Review the traces and restore a known-good Vercel deployment when needed. Branch protection and future integration into the main Nexus navigation remain **Planned**.

