# Backoffice Subproject

This subproject provides a local admin UI to edit website content in `public/content/*.json`.

## Why this stack

- No extra runtime dependencies: uses Node built-ins for serving files + API.
- Separate from the public app: isolated folder and script.
- Easy to run: one command from the root project.
- Safe file scope: API only reads/writes JSON files inside `public/content`.

## Run

```sh
npm run backoffice
```

Open `http://127.0.0.1:4310`.

## Core features implemented

- Lists available content JSON files.
- Loads one file at a time.
- Generic tree editor for:
  - objects: edit values only (keys are locked)
  - arrays: add/reorder/delete entries
  - primitive values: string/number/boolean/null editing
- New array entries are prefilled using schema templates.
- Image fields support direct upload:
  - stores file in the right `public/images/*` folder based on active JSON file
  - runs `scripts/optimize-images.js --file ...` automatically
  - deletes replaced/removed old image files (including responsive variants) on save
- Saves pretty-formatted JSON back to disk.

## Next iteration (page-specific UX)

Build focused editors per file (e.g. `book.json`, `timeline.json`) with field-level forms and validations on top of the current generic editor.
