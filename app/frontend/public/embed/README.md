# CHEFS Form Viewer Web Component

Documentation is located at [`CHEFS Tech Docs > Capabilities > Integrations > Embed your Form in another Application`](https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Embedding-Webcomponent)

```dockerfile
# Builds all the necessary artifacts for the web component
RUN npm run webcomponents:build
```

All generated assets are automatically copied to the correct locations for serving by the Express backend.

### Source Code Organization

#### **Source Files** (in `app/frontend/public/embed/`)

These files are stored in source control and copied to `dist/embed/` during build:

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

#### **Generated Files** (created in `dist/embed/` during build)

These files are **not in source control** and are created by the build process:

| File                                 | Purpose                            | HTTP Path                                       | Created By            |
| ------------------------------------ | ---------------------------------- | ----------------------------------------------- | --------------------- |
| `chefs-form-viewer.min.js`           | Minified component (production)    | `/app/embed/chefs-form-viewer.min.js`           | `npm run build:embed` |
| `chefs-form-viewer-embed.min.js`     | Minified embed script (production) | `/app/embed/chefs-form-viewer-embed.min.js`     | `npm run build:embed` |
| `chefs-form-viewer.min.js.map`       | Source map for debugging           | `/app/embed/chefs-form-viewer.min.js.map`       | `npm run build:embed` |
| `chefs-form-viewer-embed.min.js.map` | Source map for debugging           | `/app/embed/chefs-form-viewer-embed.min.js.map` | `npm run build:embed` |
| `chefs-index.css`                    | Complete CHEFS CSS bundle          | `/app/embed/chefs-index.css`                    | `extract-theme.js`    |
| `chefs-theme.css`                    | CSS variables and theming          | `/app/embed/chefs-theme.css`                    | `extract-theme.js`    |

#### **Build Scripts and Tools**

| File                                                   | Purpose                                        |
| ------------------------------------------------------ | ---------------------------------------------- |
| `app/frontend/scripts/extract-theme.js`                | Orchestrates CSS copying and theme extraction  |
| `app/frontend/src/embed/themeExtractor.js`             | Core theme extraction and CSS processing logic |
| `app/frontend/tests/unit/embed/themeExtractor.spec.js` | Unit tests for theme extraction functionality  |
| `app/frontend/tests/fixtures/chefs-index.fixture.css`  | Test fixture for theme extraction testing      |

#### **For CHEFS Developers**

- **Source files**: Edit files in `app/frontend/public/embed/`
- **Generated files**: Available in `app/frontend/dist/embed/` after running `npm run build`
- **Asset files**: In the devcontainer, created at `webcomponents/v1/assets/vendor` after running `npm run webcomponents:build` (in production, `/opt/app-root/src/app/webcomponents/v1/assets`)
- **Development**: Use non-minified files (`.js`) for easier debugging
- **Production**: Use minified files (`.min.js`, `.css`) for better performance

#### **For Embedding Developers**

- **All files are served from `/app/embed/`** (or `/pr-####/embed/` in PR environments)
- **CSS and minified JS files are only available after CHEFS build process**
- **Use `.min.js` files in production** for better performance and smaller downloads
- **CSS files (`chefs-index.css`, `chefs-theme.css`) are automatically generated** and contain the complete CHEFS styling
- **Custom themes**: Use `chefs-form-viewer-override-template.css` as a starting point. See demo themes (`chefs-form-viewer-theme-dark.css`, `chefs-form-viewer-theme-material.css`) for examples. Use `chefs-form-viewer-theme-demo.html` to test themes.

**Note**: Generated files (`.min.js`, `.css`) are created during the build process and are not stored in the source repository.

### Authentication

The webcomponent uses the `X-Chefs-Gateway-Token` header for authentication when making requests to CHEFS backend endpoints. This custom header allows host applications to use the `Authorization: Bearer` header for their own authentication needs.

- **Header name**: `X-Chefs-Gateway-Token`
- **Value**: JWT token obtained from the gateway token endpoint
- **Usage**: Automatically added to all requests to CHEFS backend URLs (URLs matching the component's `baseUrl`)
