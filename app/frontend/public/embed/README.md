# CHEFS Form Viewer Web Component

## Embeddable Form Viewer

The CHEFS Form Viewer web component lets any product or site render CHEFS-hosted Form.io forms with minimal effort and a consistent, accessible experience. It:

- Reduces embedding complexity: a single custom element is all you need.
- Improves reliability and UX: isolates styles by default (Shadow DOM) while still allowing themes.
- Standardizes behavior: submission, events, and asset loading are handled consistently across apps.
- Avoids CSP/CORS surprises: ships with same-origin asset routes to load Form.io and Font Awesome in constrained environments.

## What it is

`<chefs-form-viewer>` is a standards-based web component that renders a Form.io form, handles submission to the CHEFS backend, and exposes lifecycle events for integration. It injects CSS/JS assets, supports optional themes, and safely loads icon fonts when rendering inside Shadow DOM.

Key features

- Shadow DOM by default with optional isolation CSS for extra determinism.
- Self-hosted assets: Form.io CSS/JS and Font Awesome (for Form.io icon classes) served from backend routes.
- Optional theme layer (e.g., BC Gov theme) loaded after base styles.
- Minimal event contract with cancelable hooks and async gating (waitUntil).
- Read-only rendering, programmatic submit/draft, and prefill via `submission-id`.

### Requirements (must-have)

- The form must be designed and published in CHEFS.
- You must have a valid API key for the form. The component builds a Basic auth header from `form-id:api-key` for same-origin requests, or you can supply a custom `onBuildAuthHeader` hook.

### Quick start (embed and render)

1. Include the component script (minified) on your page:

```html
<script src="/app/frontend/public/embed/chefs-form-viewer.min.js"></script>
```

2. Add the element and call `load()`:

```html
<chefs-form-viewer
  form-id="11111111-1111-1111-1111-111111111111"
  api-key="YOUR_API_KEY"
  language="en"
  isolate-styles
></chefs-form-viewer>

<script>
  const el = document.querySelector('chefs-form-viewer');
  el.load();
  // Optional: listen to lifecycle
  el.addEventListener('formio:ready', (e) => console.log('ready', e.detail));
</script>
```

Notes

- You can also use the non-minified script during development: `chefs-form-viewer.js`.
- When using dev servers or PR environments, the component auto-detects a base of `/app` or `/pr-####` from `window.location`.

### Attributes (configuration)

- `form-id` (string, required): CHEFS/Form.io form identifier.
- `api-key` (string, required): pairs with `form-id` for same-origin Basic auth.
- `submission-id` (string): prefill the form using an existing submission.
- `read-only` (boolean): render as read-only.
- `language` (string): i18n code (default `en`).
- `base-url` (string): override the autodetected base, e.g. `https://host/app` or `https://host/pr-1234`.
- `debug` (boolean): enable verbose console logging; can also set `window.CHEFS_VIEWER_DEBUG = true`.
- `no-shadow` (boolean): render in light DOM (global page CSS may apply). In this mode styles are injected into `document.head`.
- `submit-button-key` (string): data key used to distinguish submit vs draft (default `submit`).
- `theme-css` (string): absolute URL to a theme stylesheet loaded after base styles.
- `isolate-styles` (boolean): when in Shadow DOM, adds minimal isolation (`:host { all: initial }`) and a normalized container baseline.
- `no-icons` (boolean): do not load Font Awesome (Form.io icon classes won’t render).

Boolean attribute semantics: presence, `"true"`, empty string, or `"1"` are treated as true.

### Programmatic API

- `load()` → Fetch schema and initialize.
- `reload()` → Destroy then load again.
- `submit()` → Programmatic submit (sets submit key true, posts to backend).
- `draft()` → Programmatic draft (sets submit key false, posts to backend).
- `setSubmission(data)` → Apply data to instance.
- `getSubmission()` → Read current submission from the instance.

### Events

- `formio:beforeLoad` (cancelable)
- `formio:beforeSubmit` (cancelable, supports `waitUntil(promise)`, detail: `{ submission }`)
- `formio:loadSchema` (detail: `{ form, schema }`)
- `formio:beforeInit` (cancelable, supports `waitUntil(promise)`)
- `formio:ready` (detail: `{ form }`)
- `formio:render`, `formio:change`
- `formio:submit` (detail: `{ submission }`)
- `formio:submitDone` (detail: `{ submission }`)
- `formio:error` (detail: `{ error }`)

Cancelable events support `waitUntil(promise)` to gate the action asynchronously. If any pushed promise resolves to `false` or rejects, the action is blocked.

### Asset loading and why we self-host

By default, the component loads these assets in this order:

1. Form.io base CSS
2. Font Awesome CSS (for Form.io icon classes) unless `no-icons`
3. Form.io JS (if not already present)
4. Base viewer styles (chefs-form-viewer.css)
5. Theme CSS (optional; e.g., BCGov theme)
6. Custom components bundle (chefs-form-viewer-components)

We serve Form.io CSS/JS and Font Awesome from same-origin Express routes to:

- Avoid CORS/CSP blocking in embedded contexts.
- Ensure fonts work in Shadow DOM: the component registers a document-level `@font-face` (`id="cfv-fa-face"`) for `FontAwesome` when the default icons CSS is used. This stabilizes glyph rendering (e.g., button spinners) across browsers.

If `no-icons` is set, the icons CSS/fonts are not loaded and a tiny neutralizing rule ensures glyphs don’t appear in Shadow DOM.

### Backend overview (Express routes)

Mounted under `/webcomponents` for complete isolation from `/api`:

- `GET /webcomponents/v1/form-viewer/:formId/schema` → returns `{ form, schema }` for a published form (uses the CHEFS Forms service). Rejects invalid UUIDs.
- `POST /webcomponents/v1/form-viewer/:formId/submit` → posts `{ submission }` to create a submission against the published version. Uses a mock “external” user.
- `GET /webcomponents/v1/form-viewer/components` → serves the built `chefs-form-viewer-components.use.min.js` if present.
- `GET /webcomponents/v1/form-viewer/styles` → serves `chefs-form-viewer.css`.
- `GET /webcomponents/v1/form-viewer/theme` → serves `chefs-form-viewer-bcgov.css`.
- `GET /webcomponents/v1/assets/formio.css|formio.js` → serves Form.io assets from local node_modules.
- `GET /webcomponents/v1/assets/font-awesome/css/font-awesome.min.css` and `/v1/assets/font-awesome/fonts/:file` → serves Font Awesome CSS/fonts locally.

Security notes

- `originAccess` middleware is currently permissive, but placed for future per-form origin allowlists (coming soon).
- All static asset routes set long-lived caching headers where appropriate.

### Theming and styles

- Base viewer styles are scoped to the component. Use `theme-css` or the default theme endpoint to change look/feel.
- For Shadow DOM, use `:host` and selectors like `:host .formio-form ...` to avoid leaking/breaking global styles.
- The component injects a small rule so FA icons inherit the button text color (`currentColor`) in Shadow DOM, ensuring spinners are visible.

### Prefill and read-only

- Set `submission-id` to prefill. The component prefetches the submission and applies data immediately, on the next tick, and once after first render to reduce races with Form.io internals.
- Set `read-only` to render without allowing edits.

### Authentication

- Default: if requests are same-origin with the detected/overridden `base-url`, the component sends `Authorization: Basic base64(formId:apiKey)`.
- Hook: set `el.onBuildAuthHeader = (url) => ({ Authorization: '...' })` to supply custom headers.

### Endpoints (override if needed)

The component computes defaults from `base-url` (or autodetected base). You can override via `el.endpoints = { ... }` for any of:

- `assetsCss`, `assetsJs`, `componentsJs`, `stylesCss`, `themeCss`, `iconsCss`
- `schema`, `submit`, `readSubmission`

Example:

```js
el.endpoints = {
  iconsCss:
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  themeCss: 'https://example.com/theme.css',
};
```

### Demo and local testing

- A demo page (`chefs-form-viewer-demo.html`) shows attribute toggles, event logging, and reloading read-only after submit.
- Use the minified file in demos/prod, non-minified during development.
