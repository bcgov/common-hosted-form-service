const config = require('config');

const docs = {
  // eslint-disable-next-line no-unused-vars
  getDocHTML: (version, req) => {
    // Use relative URL so it works correctly when accessed through proxies/Vue dev server
    // When accessed via Vue dev server (localhost:5173), relative URL resolves correctly
    // When accessed directly (localhost:8080), relative URL also works
    const basePath = config.get('server.basePath');
    const specUrl = `${basePath}/api/${version}/api-spec.yaml`;

    return `<!DOCTYPE html>
  <html>
    <head>
      <title>Common Hosted Form Service - Documentation ${version}</title>
      <!-- Needed for adaptive design -->
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

      <!-- ReDoc doesn't change outer page styles -->
      <style>
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <redoc spec-url='${specUrl}' />
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </body>
  </html>`;
  },
};

module.exports = docs;
