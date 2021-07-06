# Cypress Functional Testing

This directory focuses on providing functional testing for the CHEFS application.

## Quick Start

If you'd like to quickly run these Cypress tests and see what they do, Install cypress and then run the appropriate npm script.

### Install Cypress

```sh
npm ci
```

### Run Cypress Tests

By default, these Cypress tests will target our deployed Test environment of CHEFS.

```sh
# CLI Mode
npm run test

# Interactive Mode
npm run test:dev
```

## Advanced Runs

This section briefly outlines the parameters and options that can be used to modify Cypress behavior.

### Specific Browsers

```sh
# All Browsers
npm run test:allbrowsers

# Chrome
npm run test:chrome

# Edge
npm run test:edge

# Firefox
npm run test:firefox
```

### With Environment Variable Overrides

- Custom environment variables may be inserted by specifying a comma-separated list of key value pairs (`--env key1=value1,key2=value2`). More details [here](https://docs.cypress.io/guides/guides/environment-variables#Option-4-env)
- Default configuration variables may be overridden by specifying a comma-separated list of key value pairs (`--config key1=value1,key2=value2`).

```sh
npm run test -- --env depEnv=pr-123,foo=bar --config baseUrl=http://localhost:8081
npm run test:dev -- --env depEnv=pr-123,foo=bar --config baseUrl=http://localhost:8081
```

You may also specify your own `cypress.env.json` to define your own custom environment variables. More details [here](https://docs.cypress.io/guides/guides/environment-variables#Option-2-cypress-env-json)

```json
// Example cypress.env.json

{
  "depEnv": "pr-123",
  "foo": "bar"
}
```

## Best Practices

Cypress has a set of best practices that we should attempt to adhere to [here](https://docs.cypress.io/guides/references/best-practices). A few of the key points are as follows:

- Attempt to annotate your DOM elements with `data-test=foo` attributes to make selections easier
- Most tests should use network stubbing to ensure atomicity of front-end behavior (more details [here](https://docs.cypress.io/guides/guides/network-requests#Testing-Strategies))
  - Use a few full end-to-end tests for only your critical happy-path actions (login/logout, signup, etc)
- Test should be able to run independently of each other and still pass
  - We achieve this by running shared code function groups for similar action pathways
- Use multiple assertions in a single test (it's more performant especially if they're on the same pathway)
- Avoid using `after` and `afterEach` hooks - focus on designing with `before` and `beforeEach` hooks in mind instead.
- Avoid unnecessary waiting (like explicitly waiting 5 seconds for example).
  - Instead, wait on specific events or requests if needed as cypress knows how to unblock effectively

## Errata

Cypress mainly leverages the Chai framework, with some extensions for Sinon syntax. Make sure you use the equivalent syntax for assertions and testing and not Jest syntax like we do in the rest of the ecosystem. For more details, look [here](https://docs.cypress.io/guides/references/assertions).
