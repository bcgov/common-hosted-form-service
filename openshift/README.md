# Application on Openshift

This application is deployed on Openshift. This readme will outline how to setup and configure an Openshift project to get the application to a deployable state. This document assumes a working knowledge of Kubernetes/Openshift container orchestration concepts (i.e. buildconfigs, deployconfigs, imagestreams, secrets, configmaps, routes, networkpolicies, etc) and Red Hat SSO authentication.

Our CI/CD pipelines are orchestrated by [GitHub Actions](../.github/workflows).

## Table of Contents

- [Openshift Deployment Prerequisites](#openshift-deployment-prerequisites)
- [Environment Setup - ConfigMaps and Secrets](#environment-setup---configmaps-and-secrets)
- [Deployment](#deployment)
- [Templates](#templates)
- [Pull Request Cleanup](#pull-request-cleanup)
- [Appendix - Supporting Deployments](#appendix---supporting-deployments)

## Openshift Deployment Prerequisites

We assume you are logged into OpenShift and are in the repo's `/openshift` local directory. We will run the scripts from there.

### Add Default Kubernetes Network Policies

Before deploying, ensure that you have the Network Policy `allow-from-openshift-ingress` by running the following:

```sh
export NAMESPACE=<yournamespace>
oc apply -n $NAMESPACE -f allow-from-openshift-ingress.np.yaml
```

## Environment Setup - ConfigMaps and Secrets

There are some requirements in the target Openshift namespace/project which are **outside** of the CI/CD pipeline process. This application requires that a few Secrets as well as ConfigMaps are already present in the environment before it is able to function as intended. Otherwise the pipeline will fail the deployment by design.

In order to prepare an environment, you will need to ensure that all of the following configmaps and secrets are populated. This is achieved by executing the following commands as a project administrator of the targeted environment. Note that this must be repeated on _each_ of the target deployment namespace/projects (i.e. `dev`, `test` and `prod`) as that they are independent of each other. Deployments will fail otherwise. Refer to [custom-environment-variables](../app/config/custom-environment-variables.json) for the direct mapping of environment variables to the app.

### ConfigMaps

_Note:_ Replace anything in angle brackets with the appropriate value.

_Note 2:_ The Keycloak Public Key can be found in the Keycloak Admin Panel under `Realm Settings` > `Keys`. Look for the Public key button (normally under RS256 row), and click to see the key. The key should begin with a pattern of `MIIBIjANB...`.

```sh
export APP_NAME=<yourappshortname>
export NAMESPACE=<yournamespace>
export PUBLIC_KEY=<yourkeycloakpublickey>
export REPO_NAME=common-hosted-form-service
export SSO_REALM=<yourssorealm>
export STORAGE_BUCKET=<yourstoragebucket>

oc create -n $NAMESPACE configmap $APP_NAME-frontend-config \
  --from-literal=FRONTEND_APIPATH=api/v1 \
  --from-literal=VITE_FRONTEND_BASEPATH=/app \
  --from-literal=FRONTEND_ENV=dev \
  --from-literal=FRONTEND_KC_REALM=$SSO_REALM \
  --from-literal=FRONTEND_KC_SERVERURL=https://dev.loginproxy.gov.bc.ca/auth
```

```sh
oc create -n $NAMESPACE configmap $APP_NAME-sc-config \
  --from-literal=SC_CS_CHES_ENDPOINT=https://ches-dev.api.gov.bc.ca/api \
  --from-literal=SC_CS_CDOGS_ENDPOINT=https://cdogs-dev.api.gov.bc.ca/api \
  --from-literal=SC_CS_CHES_TOKEN_ENDPOINT=https://dev.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token
  --from-literal=SC_CS_CDOGS_TOKEN_ENDPOINT=https://dev.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token
```

```sh
oc create -n $NAMESPACE configmap $APP_NAME-server-config \
  --from-literal=SERVER_APIPATH=/api/v1 \
  --from-literal=SERVER_BASEPATH=/app \
  --from-literal=SERVER_BODYLIMIT=30mb \
  --from-literal=SERVER_KC_PUBLICKEY=$PUBLIC_KEY \
  --from-literal=SERVER_KC_REALM=$SSO_REALM \
  --from-literal=SERVER_KC_SERVERURL=https://dev.loginproxy.gov.bc.ca/auth \
  --from-literal=SERVER_LOGLEVEL=http \
  --from-literal=SERVER_PORT=8080
```

_Note:_ OIDC config is for moving from a custom Keycloak realm into the BC Gov standard realm a managed SSO platform. Other KC configuration will be deprecated. Urls and Client IDs will change from environment to environment.

```sh
oc create -n $NAMESPACE configmap $APP_NAME-oidc-config \
  --from-literal=OIDC_REALM=standard \
  --from-literal=OIDC_SERVERURL=https://dev.loginproxy.gov.bc.ca/auth \
  --from-literal=OIDC_JWKSURI=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs \
  --from-literal=OIDC_ISSUER=https://dev.loginproxy.gov.bc.ca/auth/realms/standard \
  --from-literal=OIDC_CLIENTID=chefs-frontend-5299 \
  --from-literal=OIDC_MAXTOKENAGE=300 \
  --from-literal=OIDC_LOGOUTURL='https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=https%3A%2F%2Fdev.loginproxy.gov.bc.ca%2Fauth%2Frealms%2Fstandard%2Fprotocol%2Fopenid-connect%2Flogout'
```

_Note:_ We use the Common Services Object Storage for CHEFS. You will need to contact them to have your storage bucket created.

```sh
oc create -n $NAMESPACE configmap $APP_NAME-files-config \
  --from-literal=FILES_UPLOADS_DIR= \
  --from-literal=FILES_UPLOADS_ENABLED=true \
  --from-literal=FILES_UPLOADS_FILECOUNT=1 \
  --from-literal=FILES_UPLOADS_FILEKEY=files \
  --from-literal=FILES_UPLOADS_FILEMAXSIZE=25MB \
  --from-literal=FILES_UPLOADS_FILEMINSIZE=0KB \
  --from-literal=FILES_UPLOADS_PATH=files \
  --from-literal=FILES_PERMANENT=objectStorage \
  --from-literal=FILES_LOCALSTORAGE_PATH= \
  --from-literal=FILES_OBJECTSTORAGE_BUCKET=$STORAGE_BUCKET \
  --from-literal=FILES_OBJECTSTORAGE_ENDPOINT=https://commonservices.objectstore.gov.bc.ca \
  --from-literal=FILES_OBJECTSTORAGE_KEY=chefs/dev/ \
```

### Secrets

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

export username=<username>
export password=<password>

oc create -n $NAMESPACE secret generic $APP_NAME-keycloak-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=$username \
  --from-literal=password=$password
```

```sh
export ches_client_id=<ches_client_id>
export ches_client_secret=<ches_client_secret>
export cdogs_client_id=<cdogs_client_id>
export cdogs_client_secret=<cdogs_client_secret>

oc create -n $NAMESPACE secret generic $APP_NAME-sc-cs-secret \
  --type=Opaque \
  --from-literal=ches_client_id=$ches_client_id \
  --from-literal=ches_client_secret=$ches_client_secret \
  --from-literal=cdogs_client_id=$cdogs_client_id \
  --from-literal=cdogs_client_secret=$cdogs_client_secret
```

```sh
export username=<username>
export password=<password>

oc create -n $NAMESPACE secret generic $APP_NAME-objectstorage-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=$username \
  --from-literal=password=$password
```

We need to store encryption keys as secrets. These keys are used to handle communication between the frontend and external APIS (proxy). We will be using `aes-256-gcm` for the encryption and keys for `aes-256-gcm` should be sha256 hashes: 256 bits/32 bytes/64 characters.

Using `node.js` you can generate keys: `crypto.createHash('sha256').update("some seed text").digest('hex');`

```sh

export proxy_key=<proxy generated hash value>

oc create -n $NAMESPACE secret generic $APP_NAME-encryption-keys \
  --type=Opaque \
  --from-literal=proxy=$proxy_key
```

## Deployment

This application is currently designed as a single application pod deployment. It will host a static frontend containing all of the Vue.js resources and assets, and a Node.js backend which serves the API that the frontend requires. We are currently leveraging Openshift Routes with path based filtering to forward incoming traffic to the right deployment service.

### Frontend

The frontend temporarily installs dependencies needed to generate the static assets that will appear in the `/app/frontend/dist` folder. These contents will be picked up by the application and hosted appropriately.

### Application

The backend is a standard [Node](https://nodejs.org)/[Express](https://expressjs.com) server. It handles the JWT based authentication via OIDC authentication flow, and exposes the API to authorized users. This deployment container is built up on top of an Alpine Node image. The resulting container after build is what is deployed.

## Templates

The CI/CD pipeline heavily leverages Openshift Templates to push environment variables, settings, and contexts to Openshift. Files ending with `.dc.yaml` specify the components required for deployment.

### Deployment Configurations

Deployment configurations will emit and handle the deployment lifecycles of running containers based off of the previously built images. They generally contain a deploymentconfig, a service, and a route. Before our application is deployed, Patroni (a Highly Available Postgres Cluster implementation) needs to be deployed. Refer to any `patroni*` templates and their [official documentation](https://patroni.readthedocs.io/en/latest/) for more details.

Our application template takes in the following required parameters:

| Name       | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| REPO_NAME  | Application repository name                                         |
| JOB_NAME   | Job identifier (i.e. 'pr-5' OR 'master')                            |
| NAMESPACE  | which namespace/"environment" are we deploying to? dev, test, prod? |
| APP_NAME   | short name for the application                                      |
| ROUTE_HOST | base domain for the publicly accessible URL                         |
| ROUTE_PATH | base path for the publicly accessible URL                           |

The CI/CD pipeline will deploy to Openshift. To deploy manually:

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

oc process -n $NAMESPACE -f openshift/app.dc.yaml -p REPO_NAME=common-hosted-form-service -p JOB_NAME=master -p NAMESPACE=$NAMESPACE -p APP_NAME=$APP_NAME -p ROUTE_HOST=$APP_NAME-dev.apps.silver.devops.gov.bc.ca -p ROUTE_PATH=master -o yaml | oc apply -n $NAMESPACE -f -
```

Due to the triggers that are set in the deploymentconfig, the deployment will begin automatically. However, you can deploy manually by use the following command for example:

```sh
oc rollout -n $NAMESPACE latest dc/<buildname>-master
```

## Pull Request Cleanup

When a PR is closed the CI/CD pipeline will automatically clean up the resources created by the deployment. To manually clear all resources for a specific PR, run the following two commands to delete all relevant resources from the Openshift project (replacing `PRNUMBER` with the appropriate number):

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

oc delete all,secret,networkpolicy,rolebinding -n $NAMESPACE --selector app=$APP_NAME-pr-<PRNUMBER>
oc delete all,svc,cm,sa,role,secret -n $NAMESPACE --selector cluster-name=pr-<PRNUMBER>
```

The first command will clear out all related executable resources for the application, while the second command will clear out the remaining Patroni cluster resources associated with that PR.

## Appendix - Supporting Deployments

There will be instances where this application will need supporting modifications or deployment such as databases and business analytics tools. Below is a list of initial reference points for other Openshift templates that could be leveraged and bolted onto the existing CI/CD pipeline if applicable.

### Metabase

- [Overview & Templates](https://github.com/bcgov/common-service-showcase/wiki/Metabase)

### Redash

- [Overview & Templates](redash)

### Patroni (HA Postgres)

Refer to the `patroni.dc.yaml` and `patroni.secret.yaml` files found below for a Highly Available Patroni cluster statefulset:

- [Templates](https://github.com/bcgov/nr-get-token/tree/master/openshift)

#### Database Backup

- [Documentation & Templates](https://github.com/bcgov/common-service-showcase/wiki/Database-Backup)

After backups are made a verification job should be run to restore the backup into a temporary database and check that tables are created and data is written. This is not a full verification to ensure all data integrity, but it is an automatable first step.

Using the `backup-cronjon-verify.yaml` file from the `redash` directory we will use the default resource values for the Development and Test Environments:

```sh
export NAMESPACE=<yournamespace>
export PVC=<yourpvcname>

oc process -f backup-cronjob-verify.yaml \
    -p BACKUP_JOB_CONFIG=backup-postgres-config \
    -p DATABASE_DEPLOYMENT_NAME=patroni-master-secret \
    -p DATABASE_PASSWORD_KEY_NAME=app-db-password \
    -p DATABASE_USER_KEY_NAME=app-db-username \
    -p JOB_NAME=backup-postgres-verify \
    -p JOB_PERSISTENT_STORAGE_NAME=$PVC \
    -p SCHEDULE="0 9 * * *" \
    -p TAG_NAME=2.9.0 \
    | oc -n $NAMESPACE apply -f -
```

For the Production environment we have a much larger database and we want the verification to complete within a reasonable amount of time. Increase the limits so that the container is not memory- or cpu-bound:

```sh
export NAMESPACE=<yournamespace>
export PVC=<yourpvcname>

oc process -f backup-cronjob-verify.yaml \
    -p BACKUP_JOB_CONFIG=backup-postgres-config \
    -p DATABASE_DEPLOYMENT_NAME=patroni-master-secret \
    -p DATABASE_PASSWORD_KEY_NAME=app-db-password \
    -p DATABASE_USER_KEY_NAME=app-db-username \
    -p JOB_NAME=backup-postgres-verify \
    -p JOB_PERSISTENT_STORAGE_NAME=$PVC \
    -p RESOURCE_LIMIT_CPU="1500m" \
    -p RESOURCE_LIMIT_MEMORY="1Gi" \
    -p SCHEDULE="0 9 * * *" \
    -p TAG_NAME=2.9.0 \
    | oc -n $NAMESPACE apply -f -
```
