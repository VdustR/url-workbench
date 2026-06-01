# URL Workbench

URL Workbench is a React and TypeScript single-page tool for inspecting, editing, comparing, encoding, and sharing URLs. It exposes URL anatomy, ordered search parameter rows, parser comparisons, encoding previews, warnings, generated code, and shareable `?url=` / `?state=` links.

Live app: https://vdustr.github.io/url-workbench/

Repository: https://github.com/VdustR/url-workbench

## Features

- Editable total URL plus protocol, hostname, port, path, search, hash, username, and password fields.
- Node-style URL readouts for `href`, `host`, `hostname`, `port`, `origin`, `pathname`, `search`, and `hash`.
- Ordered search parameter rows with enable toggles, add, duplicate, delete, keyboard reorder, and drag-and-drop sorting.
- Parser modes for native `URLSearchParams`, `qs`, and `query-string`.
- Advanced `qs` and `query-string` options for array formats, sorting, encoding, charset, null handling, parsing limits, dot notation, and primitive parsing.
- Encoding comparison for browser-native `encodeURI`, `encodeURIComponent`, strict RFC 3986, and form-style plus encoding.
- GitHub Pages deployment through GitHub Actions.

## Query Parser Coverage

| Mode              | Use for                                                     | Important settings                                                                          |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `URLSearchParams` | Browser-native form-style serialization                     | Fixed duplicate-key behavior and plus-space encoding                                        |
| `qs`              | Nested query strings and backend-style parser compatibility | Array format, dot notation, duplicate handling, charset, parse limits, strict null handling |
| `query-string`    | Lightweight client-side query strings                       | Array format, strict encoding, skip null or empty values, number and boolean parsing        |

## Local Development

Install dependencies:

```bash
vp install --frozen-lockfile
```

Run the app:

```bash
vp dev
```

Useful commands:

```bash
vp check
vp test
vp build
pnpm typecheck
pnpm typecheck:tsc
pnpm e2e
```

`pnpm e2e` requires a local Playwright browser binary. On a fresh machine, install Chromium once:

```bash
pnpm exec playwright install chromium
```

## Deployment

GitHub Pages deployment is defined in `.github/workflows/deploy.yml`.

The workflow uses:

- `voidzero-dev/setup-vp@v1`
- `vp install --frozen-lockfile`
- `vp check`
- `vp test`
- `vp build`
- `actions/configure-pages@v6`
- `actions/upload-pages-artifact@v5`
- `actions/deploy-pages@v5`

Pull requests run install, check, test, and build. Pushes to `main` also upload the build artifact and deploy to GitHub Pages.

The Vite base path is `/url-workbench/` in GitHub Actions and `/` locally.

## Stack

- Vite+ with the local `vp` CLI and `vite-plus`
- React and TypeScript
- Base UI, Emotion, Nanostores, dnd-kit
- Native `URLSearchParams`, `qs`, and `query-string`
- Vitest and Playwright

## License

MIT License, VdustR (ViPro) 2026.
