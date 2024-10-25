# Redash Data Visualization

CHEFS uses [Redash](https://redash.io) to visualize forms metadata and display it in dashboards.

## Install Pre-requisites

The Redash Helm Chart doesn't work well in OpenShift due to the accounts it is trying to use for PostgreSQL and Redis. Install our own versions of them:

```sh
oc process -f secrets.yaml | oc -n a12c97-tools apply -f -
oc process -f postgresql.deploy.yaml | oc -n a12c97-tools apply -f -
oc process -f redis.deploy.yaml | oc -n a12c97-tools apply -f -
oc process -f redash.route.yaml | oc -n a12c97-tools apply -f -
```

Set up the PostgreSQL backup as a CronJob using the [backup-container](https://github.com/BCDevOps/backup-container):

```sh
oc process -f backup-cronjob.yaml \
    -p DATABASE_DEPLOYMENT_NAME=chefs-redash-postgresql \
    -p DATABASE_NAME=redash \
    -p DATABASE_PASSWORD_KEY_NAME=POSTGRES_PASSWORD \
    -p DATABASE_SERVICE_NAME=chefs-redash-postgresql \
    -p DATABASE_USER_KEY_NAME=POSTGRES_USER \
    -p JOB_NAME=backup-chefs-redash-postgres \
    -p JOB_PERSISTENT_STORAGE_NAME=backup-chefs-redash-postgresql \
    -p MONTHLY_BACKUPS=3 \
    -p SCHEDULE="0 8 * * *" \
    -p TAG_NAME=2.9.0 \
    -p WEEKLY_BACKUPS=8 \
    | oc -n a12c97-tools apply -f -
```

Verify the backup using another cron job. The file `backup-cronjob-verify.yaml` has been lightly modified from `backup-cronjob.yaml` in the `backup-container` repo.

```sh
oc process -f backup-cronjob-verify.yaml \
    -p BACKUP_JOB_CONFIG=backup-chefs-redash-postgres-config \
    -p DATABASE_DEPLOYMENT_NAME=chefs-redash-postgresql \
    -p DATABASE_PASSWORD_KEY_NAME=POSTGRES_PASSWORD \
    -p DATABASE_USER_KEY_NAME=POSTGRES_USER \
    -p JOB_NAME=backup-chefs-redash-postgres-verify \
    -p JOB_PERSISTENT_STORAGE_NAME=backup-chefs-redash-postgresql \
    -p SCHEDULE="0 9 * * *" \
    -p TAG_NAME=2.9.0 \
    | oc -n a12c97-tools apply -f -
```

## Install Redash

The [Redash Helm Chart](https://github.com/getredash/contrib-helm-chart) is an easy way to install Redash.

Add the chart repository to Helm:

```sh
helm repo add redash https://getredash.github.io/contrib-helm-chart/
```

Set up the configuration file:

```sh
cat > my-values.yaml <<- EOM
redash:
  cookieSecret: $(openssl rand -base64 32)
  externalRedisSecret: chefs-redash-redis
  secretKey: $(openssl rand -base64 32)
postgresql:
  enabled: false
externalPostgreSQL: postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@chefs-redash-postgresql:5432/redash
redis:
  enabled: false
externalRedis: redis://chefs-redash-redis:6379/redash
EOM
```

For the `externalPostgreSQL` database connection setting replace the `<POSTGRES_USER>` and `<POSTGRES_PASSWORD>` placeholders using values from the `redash-postgresql` secret.

> Note: The error `[CRITICAL] WORKER TIMEOUT` happens in the `chefs-redash` pod because it can't spin up fast enough. It will get restarted by the probes and never starts. Before you run the following command, load up the Deployments in the OpenShift console and be prepared to reduce `chefs-redash` to 0 pods.

Install Redash:

```sh
helm -n a12c97-tools upgrade --install -f my-values.yaml chefs redash/redash
```

Edit the `chefs-redash` Deployment and change the `initialDelaySeconds` for both the `liveness` and `readiness` probes to `60` seconds. Then spin it up to a single pod. It's a good idea to tune the CPU and memory requests and limits to values that correspond to what the pods tend to run at (they will vary).

If you ever need to uninstall Redash:

```sh
helm -n a12c97-tools delete chefs
```

## Data Sources

Network policies are created to allow Redash to access the readonly database replicas:

```sh
oc process -f patroni.networkpolicy.yaml | oc -n a12c97-dev apply -f -
oc process -f patroni.networkpolicy.yaml | oc -n a12c97-test apply -f -
oc process -f patroni.networkpolicy.yaml | oc -n a12c97-prod apply -f -
```

## Redash Configuration

Redash should be up and running. Log in and create the Users, Data Sources, Queries, Visualizations, and Dashboards that you need.

### SAML Authentication with Red Hat SSO (Keycloak)

To integrate Redash with SSO, go into `Settings` and in the `General` tab's `SAML` section:

1. For `SAML Enabled` choose `Enabled (Dynamic)`
1. Set `SAML Metadata URL` to `https://loginproxy.gov.bc.ca/auth/realms/chefs/protocol/saml/descriptor`
1. Set `SAML Entity ID` to `unused` (or any value) as there is a bug in v10 of Redash and the `SAML Entity ID` value is overwritten by the Redash callback URL. This will be handled when setting up the client in SSO.
1. Set `SAML NameID Format` to `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`

### Redash Client in SSO

In SSO create a new `Client` and:

1. Set `Client ID` to `https://chefs-redash.apps.silver.devops.gov.bc.ca/saml/callback?org_slug=default` to deal with the v10 bug
1. Set `Client Protocol` to `saml`
1. Set `Client SAML Endpoint` also to `https://chefs-redash.apps.silver.devops.gov.bc.ca/saml/callback?org_slug=default`
1. Click `Save`

After creating the client, do the following configuration:

1. Set `Sign Assertions` to `On`
1. Set `Canonicalization Method` to `EXCLUSIVE_WITH_COMMENTS`
1. Set `Client Signature Required` to `Off`
1. Set `Name ID Format` to `email`
1. Set `Valid Redirect URIs` to `https://chefs-redash.apps.silver.devops.gov.bc.ca/*`
1. Click `Save`

In the `Mappers` click `Add Builtin` and add `X500 givenName` and `X500 surname`.

Edit `x500 givenName` and

1. Set `Friendly Name` to `FirstName`
1. Set `SAML Attribute Name` to `FirstName`

Edit `x500 surname` and

1. Set `Friendly Name` to `LastName`
1. Set `SAML Attribute Name` to `LastName`

## Custom Image

The Redash v10.0.0b50363 image used by the Helm chart contains security vulnerabilities, particularly in the `pysaml2` package. Create a buildconfig with a Dockerfile:

```
FROM docker.io/redash/redash:10.1.0.b50633
USER root
RUN pip install --upgrade pysaml2==6.5.0
```

Use the new image for the five Redash deployments by replacing `redash/redash:10.0.0.b50363` with `image-registry.openshift-image-registry.svc:5000/a12c97-tools/redash:10.1.0-patched`.
