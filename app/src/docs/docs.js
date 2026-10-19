const config = require('config');

const docs = {
  getDocHTML: (version) => `<!DOCTYPE html>
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
      <redoc spec-url='${config.get('server.basePath')}/api/${version}/api-spec.yaml' />
      <!-- CCP-6166: pinned to v2.5.3, the last stable release before redoc@3.0.0
           (released 2026-10-14). Latest breaks with script tag, 
           will wait for 3.x to be stable before upgrading   -->
      <script src="https://cdn.redoc.ly/redoc/v2.5.3/bundles/redoc.standalone.js"></script>
    </body>
  </html>`,
};

module.exports = docs;
