# RoamJS Extension Base

Stock base for [RoamJS](https://roamjs.com) Roam Research extensions. **Fork this repo** to start a new extension.

## What's included

- **roamjs-components** — shared utilities, DOM helpers, queries, writes, and UI components
- **Samepage build** — `samepage build` produces the Roam Depot–ready bundle
- **Settings panel** — example `extensionAPI.settings.panel.create` with an Enable switch
- **TypeScript** — tsconfig extending `@samepage/scripts`
- **CI** — GitHub Actions to build on push/PR (uses RoamJS secrets for publish)

## After forking

1. **Rename the repo** and update `package.json`:
   - `name`: your extension slug (e.g. `my-extension`)
   - `description`: one line describing the extension

2. **Implement in `src/index.ts`**:
   - Keep or replace the settings panel
   - Add your logic using `roamjs-components` (e.g. `createHTMLObserver`, `createBlock`, `renderToast`)
   - Return `{ unload }` to clean up on unload

3. **Update all instances of `{Extension Name}` to the name of the extension.**

### Rules for Agents updating this README.md

- refer to README-TEMPLATE.md for the structure of the README.md
- This is a marketing document. It is user facing, not developer facing.
- Do not include reference to Roam Research (eg: This is a Roam Research extension), that is implied.
- Do not include build instructions (eg: `npm run build:roam`).
- update `# RoamJS Extension Base` to the name of the extension.
- update askdeepwiki badge to the name of the extension.
- update the description to be a < 250 character description of the extension. This should be enticing to new users to install the extension.
- add a `## Features` section to the README.md with a list of the features of the extension.

3. **Prefer**: Add React components under `src/components/` (see [autocomplete](https://github.com/RoamJS/autocomplete), [giphy](https://github.com/RoamJS/giphy) for examples).

4. **Secrets (for publish)** — in the forked repo, configure:
   - `ROAMJS_RELEASE_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`, `ROAMJS_PROXY` (vars)

## Scripts

- `npm start` — samepage dev (local development)
- `npm run build:roam` — build for Roam (dry run; CI runs `npx samepage build`)

## License

MIT
