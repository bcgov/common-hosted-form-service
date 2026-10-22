# CHEFS Form Viewer Web Component

Documentation is located at [`CHEFS Tech Docs > Capabilities > Integrations > Embed your Form in another Application`](https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Embedding-Webcomponent)

Releases are cut from these sources into `app/embed/releases/<version>/` and committed. The image build does not generate web component files. See [`app/embed/README.md`](../../../embed/README.md) for the release layout and how to cut a release.

### Source Code Organization

#### **Source Files** (in `app/frontend/public/embed/`)

These files are the source for future releases. The frontend build does not ship them; the HTTP paths below serve the frozen v1 copies in `app/embed/releases/v1/embed/`:

| File                                                                                   | Purpose                               | HTTP Path                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| [`chefs-form-viewer.js`](./chefs-form-viewer.js)                                       | Main web component (development)      | `/app/embed/chefs-form-viewer.js`                    |
| [`chefs-form-viewer-embed.js`](./chefs-form-viewer-embed.js)                           | Simplified embed script (development) | `/app/embed/chefs-form-viewer-embed.js`              |
| [`chefs-form-viewer-generator.html`](./chefs-form-viewer-generator.html)               | Code generator tool                   | `/app/embed/chefs-form-viewer-generator.html`        |
| [`chefs-form-viewer-embed-demo.html`](./chefs-form-viewer-embed-demo.html)             | Interactive embed demo                | `/app/embed/chefs-form-viewer-embed-demo.html`       |
| [`chefs-form-viewer-override-template.css`](./chefs-form-viewer-override-template.css) | CSS theme template for customization  | `/app/embed/chefs-form-viewer-override-template.css` |
| [`chefs-form-viewer-theme-dark.css`](./chefs-form-viewer-theme-dark.css)               | Dark mode/cyberpunk demo theme        | `/app/embed/chefs-form-viewer-theme-dark.css`        |
| [`chefs-form-viewer-theme-material.css`](./chefs-form-viewer-theme-material.css)       | Material Design demo theme            | `/app/embed/chefs-form-viewer-theme-material.css`    |
| [`chefs-form-viewer-theme-demo.html`](./chefs-form-viewer-theme-demo.html)             | Theme testing demo tool               | `/app/embed/chefs-form-viewer-theme-demo.html`       |
| [`README.md`](./README.md)                                                             | This documentation                    | `/app/embed/README.md`                               |

#### **Release Tools**

| File                                                   | Purpose                                                 |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `app/scripts/embed-release.js`                         | `npm run embed:release -- <x.y.z>` cuts a release       |
| `app/src/webcomponents/common/releaseBuilder.js`       | Assembles a release folder and its `integrity.json`     |
| `app/frontend/src/embed/themeExtractor.js`             | Builds `chefs-theme.css` from the frontend CSS bundle   |
| `app/frontend/tests/unit/embed/themeExtractor.spec.js` | Unit tests for theme extraction functionality           |
| `app/frontend/tests/fixtures/chefs-index.fixture.css`  | Test fixture for theme extraction testing               |

#### **For CHEFS Developers**

- **Source files**: Edit files in `app/frontend/public/embed/`
- **Development**: The Vite dev server serves this folder at `/app/embed/`; use non-minified files (`.js`) for easier debugging
- **Releases**: Cut with `npm run embed:release -- <x.y.z>` from `app/`; released files never change

#### **For Embedding Developers**

- **v1 files keep their URLs under `/app/embed/`** (or `/pr-####/embed/` in PR environments)
- **Versioned releases are served from `/app/embed/<x.y.z>/`** with long-lived caching and CORS for SRI
- **Use `.min.js` files in production** for better performance and smaller downloads
- **Custom themes**: Use `chefs-form-viewer-override-template.css` as a starting point. See demo themes (`chefs-form-viewer-theme-dark.css`, `chefs-form-viewer-theme-material.css`) for examples. Use `chefs-form-viewer-theme-demo.html` to test themes.

### Authentication

#### Obtaining a gateway token (server-side only)

Your backend must fetch the JWT before passing it to the embed. Call this endpoint from your server — never expose the form API key to the browser.

- **Endpoint**: `POST {basePath}/gateway/v1/auth/token/forms/{formId}`
- **Authorization**: `Basic base64(formId:apiKey)` (required)
- **Response**: `201 { "token": "<jwt>" }`

The `formId` in the URL must match the `formId` in the Basic auth credentials.

#### Using the token in the webcomponent

The webcomponent uses the `X-Chefs-Gateway-Token` header for authentication when making requests to CHEFS backend endpoints. This custom header allows host applications to use the `Authorization: Bearer` header for their own authentication needs.

- **Header name**: `X-Chefs-Gateway-Token`
- **Value**: JWT token obtained from the gateway token endpoint above
- **Usage**: Automatically added to all requests to CHEFS backend URLs (URLs matching the component's `baseUrl`)
