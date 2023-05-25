# CHEFS Frontend

This is the CHEFS frontend. It implements a Vue frontend with Keycloak authentication support.

## Configuration

The CHEFS frontend will require some configuration. The API it invokes will be locked down and require a valid JWT Token to access. We will need to configure the application to authenticate using the same Keycloak realm as the [app](../). Note that the Vue Skeleton frontend is currently designed to expect all associated resources to be relative to the original access path.

## Super Quickstart

Ensure that you have filled in all the appropriate configurations following [../config/custom-environment-variables.json](../config/custom-environment-variables.json) before proceeding. Other environment variables such as the app title and contact information must be configured using the Vue environment files [.env](.env), [.env.development](.env.development), [.env.test](.env.test).

Entries in the JSON file are deployed with the application. Entries in the .env files are per-environment.

### Required .env variables

| Name | Description | Example |
|---|---|---|
| VUE_APP_TITLE | The application title | Common Hosted Forms Service |
| VUE_APP_CONTACT | Contact information such as email | submit.digital@gov.bc.ca |
| VUE_APP_FRONTEND_BASEPATH | The path to the Vue application | /app |

### Project setup

``` sh
npm install
```

### Compiles and hot-reloads for development

``` sh
npm run serve
```

### Compiles and minifies for production

``` sh
npm run build
```

### Run your unit tests

``` sh
npm run test:unit
```

### Lints and fixes files

``` sh
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
