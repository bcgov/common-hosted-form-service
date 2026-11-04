# CHEFS Web Component Releases

Each folder in `releases/` is a committed, immutable release of the `chefs-form-viewer` web component and the files it loads. A release never changes after it is committed; a fix is a new version.

## Serving

| Release | URL                         | Notes                                                                                                                                                                   |
| ------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1`    | Legacy URLs (see below)     | Frozen copy of everything the image build used to generate. Byte-identical to before, except `chefs-index.css`, whose font and image URLs now point at `chefs-assets/`. |
| `x.y.z` | `/app/embed/<x.y.z>/<path>` | Every file in the folder, including `integrity.json`.                                                                                                                   |

What each release contains, and how to embed one, is in [`app/frontend/public/embed/README.md`](../frontend/public/embed/README.md#releases).

Base paths follow the deployment, for example `/pr-1234/embed/1.1.0/...` in PR environments.

`v1` keeps its original URLs:

- `/app/embed/<file>` from `releases/v1/embed/`
- `/app/webcomponents/v1/assets/...` from `releases/v1/assets/`
- `/app/webcomponents/v1/form-viewer/{components,styles,theme}` from `releases/v1/form-viewer/`

Versioned releases are served with:

- `Access-Control-Allow-Origin: *`, required for cross-origin scripts, stylesheets and fonts loaded with `integrity`
- `Cross-Origin-Resource-Policy: cross-origin`
- `Cache-Control: public, max-age=31536000, immutable`
- `X-Content-Type-Options: nosniff`

A path whose first segment is `x.y.z` belongs to releases: an unknown version or file returns a JSON 404 with the same CORS headers. A range past the end of a file returns 416 and a failed conditional request 412; these and read errors (500) are sent with `Cache-Control: no-store`, so an error is never cached as the file. Dotfiles and directory listings are never served, and a release must not contain links. Any other path falls through to the `v1` files and then the frontend.

## Layout

Versioned releases use the same layout as `v1`:

```text
releases/<x.y.z>/
  embed/        chefs-form-viewer and chefs-form-viewer-embed (.js, .min.js, .min.js.map) and theme CSS
  assets/       chefs-index.css, chefs-theme.css, chefs-assets/, formio, font-awesome
  form-viewer/  BC Gov custom components bundle and its CSS
  integrity.json
```

`integrity.json` maps every other file in the release to its SRI hash (`sha384-...`).

## Cutting a release

From `app/` in the devcontainer, with frontend and components dependencies installed:

```sh
npm run embed:release -- 1.1.0
```

The tool:

1. Refuses a version that is not `x.y.z` or a folder that already exists.
2. Runs the frontend build (`build:formio`, `deploy:formio`, `build`) so the CSS bundle and components are current.
3. Copies formio, Font Awesome, the components bundle and the theme CSS files in `app/frontend/public/embed/`; writes `chefs-index.css` with its asset URLs pointed at `chefs-assets/` (any other reference fails the cut) and `chefs-theme.css`.
4. Builds `chefs-form-viewer` and then `chefs-form-viewer-embed` from `app/frontend/public/embed/`. In each script it replaces:

   - `/*__CHEFS_RELEASE_INTEGRITY__*/ {}` with the SRI hashes of every file written before it, so the component can load its files with `integrity`
   - `/*__CHEFS_RELEASE_VERSION__*/ null` with the version string

   Each script must contain each placeholder exactly once; a missing, repeated or reformatted placeholder fails the cut.

5. Writes `integrity.json`, then moves the assembled folder into place. An interrupted cut can leave a `.<version>.partial` folder; it is gitignored, never served, and the unit tests flag it.
6. Prints the line to add to `PINNED_INTEGRITY` in `tests/unit/webcomponents/common/releases.spec.js`.

Options:

- `--out <dir>` writes to another folder, for a dry run; a relative path is relative to `app/`
- `--skip-build` reuses the current frontend and components build

Commit the new folder and the pinned hash together. The unit tests fail if any released file differs from its `integrity.json`, if an `integrity.json` differs from its pinned hash, or if the release folders and the pinned list differ.
