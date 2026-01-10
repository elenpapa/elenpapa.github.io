--# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Optimize Images

```sh
npm run optimize-images -- --help
```

Runs `scripts/optimize-images.js`, which centralizes all the helpers that previously lived across multiple files. You can pass flags to target a single file, folder, or everything.

- `-f, --file <path>`: optimize one file (`public/images/...`).
- `-d, --folder <name>`: process a folder such as `services`, `posts/webp`, `publishers`, `common`, `books`, `moonlight`, `painted-books`, or the project `root` (for `hero.png`, `intro.png`, etc.).
- `-a, --all`: shrink every configured folder in one go.
- `-t, --type <type>`: choose `webp`, `responsive`, or `all` (default `all`).
- `--force`: regenerate even if the target already exists.
- `-q, --quality <num>`: override the default quality (1-100).
- `--dry-run`: preview the changes without writing files.

Examples:

```sh
npm run optimize-images -- -f "services/Service 1.png"
npm run optimize-images -- -d services --dry-run
npm run optimize-images -- -d "posts/webp" -t responsive
npm run optimize-images:all
```
