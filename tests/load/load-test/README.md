# CHEFS Load Test Utility

This utility is intended to be run by a developer against any fully running instance of CHEFS. The default configuration is against CHEFS Dev Master, using a Keycloak client (chefs-load-test) and user (chefs-load-test).

## Red Hat SSO (Keycloak) Setup

Create the `chefs-load-test` client by importing [sso_client_chefs-load-test.json](./sso_client_chefs-load-test.json).

Create a `User` also named `chefs-load-test` with:

- an `Attribute` called `idir_user_guid` and the value `chefs-load-test@idir`
- a password set in the `Credentials`
- a `Role Mapping` of `default-role-chefs`

## Configuration

The utility leverages the [config](https://www.npmjs.com/package/config) library, which can read environment variables or files (see [/config](./config)). The default configuration does not contain a password, so the developer can set it via a local.json or environment variable `AUTH_PASSWORD`.

There is currently a single valid schema/submission: `kitchen_sink_advanced`. To add another, follow the naming and folder location layout (`./schema/<new_type>_schema.json` and `./submissions/<new_type>_submission.json`). Set via the submissions.schema configuration variable.

## Running

Ensure that the configuration is set correctly, and start with small batches...

```sh
npm run load-test
```

## Results

Expect the following layout for results:

```sh
info
info ==============================================================================
info              API: https://chefs-dev.apps.silver.devops.gov.bc.ca/app/api/v1
info             User: chefs-load-test
info             Form: CHEFS Load Test - 2020-10-23T21:20:09.043Z - (5)
info Submission Count: 5
info ==============================================================================
info
info Create Form ElapsedMS             :        553
info
info Create Submissions (Avg) ElapsedMS:        294
info Create Submissions (Min) ElapsedMS:        199
info Create Submissions (Max) ElapsedMS:        439
info
info Get Submissions ElapsedMS         :        157
info Export Submissions ElapsedMS      :        243
info
info Get Submissions Size              :       1.76kb
info Export Submissions Size           :       42.7kb
info
info ==============================================================================
info
```
