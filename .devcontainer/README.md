# CHEFS Development with Dev Container

Please refer to the online [CHEFS Techdocs](https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/):
- [CHEFS Development with Dev Container](https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Developer/Contributors/CHEFS-Development-with-Dev-Container/)
- [Local Setup](https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Developer/Contributors/Local-Setup/)

## Turnstile

For an end-to-end test, use a development Turnstile widget that allows
`localhost`. Set `turnstile.siteKey` and `turnstile.secretKey` in your ignored
`.devcontainer/chefs_local/local.json` and restart the CHEFS backend. The
devcontainer creates this file from `local.sample.json` on first setup. Its
`turnstile.hostnames` setting defaults to `localhost` in the sample.

Cloudflare's dummy verification response omits the action and form data that
CHEFS checks, so use the development widget's real key pair.
