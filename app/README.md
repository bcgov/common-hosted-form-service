# Common Hosted Forms Application

This node.js app hosts the Common Hosted Forms frontend.

## Settings

This app will require some configuration. The API will be locked down and require a valid JWT Token to access. We will need to configure the application to authenticate using the same Keycloak realm as the [frontend](frontend).

## Super Quickstart

Ensure that you have filled in all the appropriate configurations shown in [config/custom-environment-variables.json](config/custom-environment-variables.json) before proceeding.
You can configure your **database connection**, **front and back-end paths** and **authentication parameters** as well as **object storage** for file uploads with a local configuration file '/app/config/local.json' or [openshift config maps](../openshift/README.md).

In general, most of these npm run scripts can be prepended with `all:` in order to run the same operation on both the application and the frontend sequentially.

### Database Tasks

Migrate Database

``` sh
npm run migrate
```

Seed Database with Example Data

``` sh
npm run seed:run
```

### Production Build and Run

``` sh
npm run all:fresh-start
```

### Development Run

``` sh
npm run serve
```

Start a new terminal

``` sh
cd frontend
npm run serve
```

### Run application tests

``` sh
npm run test
```

### Lints and fixes application files

``` sh
npm run lint
npm run lint-fix
```

### Turnstile for hosted form submission

Set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to the keys for a Cloudflare
Turnstile widget that allows the CHEFS hostname. Set `TURNSTILE_HOSTNAMES` to a
comma-separated list of allowed browser hostnames. OpenShift sets this from
the deployment route hostname and any additional browser hostnames. Provision the
`chefs-<JOB_NAME>-turnstile` Secret with `turnstile-site-key` and
`turnstile-secret-key` entries.
CHEFS must be able to reach `https://challenges.cloudflare.com` for server-side
verification, and browsers must be able to load the widget from that origin.

Hosted forms that allow Public or Basic BCeID require verification before the
form opens. With missing credentials, those forms stay closed. The verification
cookie lasts 15 minutes and is scoped to the form and current CHEFS identity.
If proof expires while a user fills out the form, CHEFS asks them to verify
again before sending the submission.

Each verification allows one final submission, draft finalization, or bulk
import of up to 1,000 rows. Ordinary draft saves do not spend the allowance.
PostgreSQL records a spent proof in the same transaction as the submission.
A bounded cleanup runs every 30 minutes and retains expired proof IDs for five
extra minutes to cover duplicate Cloudflare token redemption.
