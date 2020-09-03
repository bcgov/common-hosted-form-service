# Common Hosted Forms Application

This node.js app hosts the Common Hosted Forms frontend.

## Settings

This app will require some configuration. The API will be locked down and require a valid JWT Token to access. We will need to configure the application to authenticate using the same Keycloak realm as the [frontend](frontend).

## Super Quickstart

Ensure that you have filled in all the appropriate configurations following [config/custom-environment-variables.json](config/custom-environment-variables.json) before proceeding.

In general, most of these npm run scripts can be prepended with `all:` in order to run the same operation on both the application and the frontend sequentially.

### Database Tasks

Migrate Database

``` sh
npm run migrate
```

Seed Database with Example Data

``` sh
./node_modules/.bin/knex seed:run
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
