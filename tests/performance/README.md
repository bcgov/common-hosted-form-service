# Performance/Load Tests

CHEFS uses [k6](https://grafana.com/docs/k6/latest/) for performance/load tests.

The tests require an IDIR user's token. Each CHEFS environment should have a configured IDIR user for the [functional]() tests. Please get in touch with the test lead for the account information.

## Configuration

k6 will require a lot of environment variables. When running the `dev container,` we have added [dotenv-cli](https://www.npmjs.com/package/dotenv-cli), allowing us to pass in an environment file instead of each variable.

### Variables

Review [sample-env](./sample-env) to see a local configuration example.

| var                     | notes                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `OIDC_TOKEN_URL`        | token url for OIDC provider                                                        |
| `OIDC_CLIENT_ID`        | the CHEFS SSO client ID for that provider                                          |
| `BASE_URL`              | CHEFS instance to load test (need to include the base path ex. /app or /pr-123)    |
| `FORM_NAME`             | one of the fixtures                                                                |
| `SCENARIOS`             | which scenarios to execute                                                         |
| `RPS`                   | Requests Per Second - do not use more than 50 without consulting Platform services |
| `TEST_RUN_USERS`        | number of users for `test_run` stage                                               |
| `MIN_USERS`             | min. virtual users for load tests                                                  |
| `MAX_USERS`             | max. virtual users for load tests                                                  |
| `AVERAGE_USERS`         | avg. virtual users for load tests                                                  |
| `STRESS_LOAD_USERS`     | avg. virtual users for `load_with_spike` and `stress` stages                       |
| `STAGE`                 | which stage to run                                                                 |
| `INITIAL_TOKEN`         | the IDIR test user access_token                                                    |
| `INITIAL_REFRESH_TOKEN` | the IDIR test user refresh_token                                                   |

### Token

For the given execution environment, you will need to fetch a current token.

- Open a browser with developer tools to see the Network calls and their responses.
- Get the credentials for that CHEFS instance from the test lead, go to `BASE_URL` and sign in.
- Look for the `token` request and copy the `access_token` attribute (set `INITIAL_TOKEN`) and the `refresh_token` attribute (set the `INITIAL_REFRESH_TOKEN `).

```
cd tests/performance
cp .sample-env .env
< set INITIAL_TOKEN and INITIAL_REFRESH_TOKEN values >
```

## Execution

Let's assume we are in the `devcontainer` and running CHEFS using the local defaults, and we've set the token configurations.

Example:

```
cd tests/performance
dotenv -e .env k6 run backend.js
```

## Scenarios

`createForm` - will create a form using the `FORM_NAME` environment variable.

`createAndPublishForm` - will create a form using the `FORM_NAME` environment variable and publish it.

`fetchAndSubmitForm` - requires that the token user has an existing, published version of `FORM_NAME`. This will create a matching submission for that form and post it. This test is best used in conjunction with `createAndPublishForm ` - by default it will start with a slight delay which allows a form to be created and published on an empty CHEFS instance.
