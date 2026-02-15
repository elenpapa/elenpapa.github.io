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

## Structure

```text
backoffice/
  server.mjs                      # bootstrap only
  server/
    config.mjs                    # env + resolved paths
    constants.mjs                 # MIME/types + folder mappings
    request-handler.mjs           # API/static routing
    services/
      content-files.mjs           # content JSON read/write/list
      images.mjs                  # image index/upload/cleanup
      static-files.mjs            # static file serving helper
    utils/
      http.mjs                    # JSON/text responses + body parsing
      path-guards.mjs             # safe filesystem path resolution
  public/
    index.html
    styles.css
    js/
      main.js                     # browser entrypoint
      app.js                      # controller/state orchestration
      api.js                      # API client
      constants.js                # templates + file usage references
      dom.js                      # element lookup
      state.js                    # state helpers
      utils.js                    # shared value helpers
      views/
        content-editor.js         # recursive JSON editor view
        images-library.js         # read-only images view
```

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
- Includes a read-only `Images` section:
  - shows preview, file name, relative path, and size
  - shows all JSON references (`file -> json path`) where each image is used
  - includes quick `Open` actions to jump to the related content file editor

## Next iteration (page-specific UX)

Build focused editors per file (e.g. `book.json`, `timeline.json`) with field-level forms and validations on top of the current generic editor.
