# Redash Data Visualization

CHEFS uses [Redash](https://redash.io) to visualize forms metadata and display it in dashboards.

## Install Pre-requisites

The Redash Helm Chart doesn't work well in OpenShift due to the accounts it is trying to use for PostgreSQL and Redis. Install our own versions of them:

```
$ oc process -f secrets.yaml | oc -n a12c97-tools apply -f -
$ oc process -f postgresql.deploy.yaml | oc -n a12c97-tools apply -f -
$ oc process -f redis.deploy.yaml | oc -n a12c97-tools apply -f -
$ oc process -f redash.route.yaml | oc -n a12c97-tools apply -f -
```

## Install Redash

The [Redash Helm Chart](https://github.com/getredash/contrib-helm-chart) is an easy way to install Redash.

Add the chart repository to Helm:

```
$ helm repo add redash https://getredash.github.io/contrib-helm-chart/
```

Set up the configuration file:

```
$ cat > my-values.yaml <<- EOM
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

```
$ helm -n a12c97-tools upgrade --install -f my-values.yaml chefs redash/redash
```

Edit the `chefs-redash` Deployment and in `spec.template.spec.containers` replace:

```
        - resources: {}
```

with:

```
        - resources:
            limits:
              cpu: 600m
            requests:
              cpu: 100m
```

Then spin it up to a single pod.

If you need to uninstall Redash:

```
$ helm -n a12c97-tools delete chefs
```

## Data Sources

Network policies are created to allow Redash to access the readonly database replicas:

```
$ oc process -f patroni.networkpolicy.yaml | oc -n a12c97-dev apply -f -
$ oc process -f patroni.networkpolicy.yaml | oc -n a12c97-test apply -f -
$ oc process -f patroni.networkpolicy.yaml | oc -n a12c97-prod apply -f -
```

To provide a way for Redash to log into each database, create a `redash` user that only has readonly access. Using the passwords from the `chefs-redash-admin` secret run:

```
CREATE USER redash WITH PASSWORD '<PASSWORD>';
GRANT CONNECT ON DATABASE chefs TO redash;
GRANT USAGE ON SCHEMA public TO redash;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO redash;
```

## Redash Configuration

Redash should be up an running. Log in and create the users, databases, queries, visualizations, and dashboards that you need.
