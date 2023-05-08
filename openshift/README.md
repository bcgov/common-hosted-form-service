# Application on Openshift

This application is deployed on Openshift. This readme will outline how to setup and configure an Openshift project to get the application to a deployable state. This document assumes a working knowledge of Kubernetes/Openshift container orchestration concepts (i.e. buildconfigs, deployconfigs, imagestreams, secrets, configmaps, routes, networksecuritypolicies, etc)

Our builds and deployments are orchestrated with Jenkins. Refer to [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the Openshift templates are used for building and deploying in our CI/CD pipeline.

## Table of Contents

- [Openshift Deployment Prerequisites](#openshift-deployment-prerequisites)
- [Environment Setup - ConfigMaps and Secrets](#environment-setup---configmaps-and-secrets)
- [Build Config & Deployment](#build-config--deployment)
- [Templates](#templates)
- [Pull Request Cleanup](#pull-request-cleanup)
- [Appendix - Supporting Deployments](#appendix---supporting-deployments)

## Openshift Deployment Prerequisites

We assume you are logged into OpenShift and are in the repo/openshift local directory. We will run the scripts from there.

### Add Default Kubernetes Network Policies

Before deploying, ensure that you have the Network Policies `deny-by-default` and `allow-from-openshift-ingress` by running the following:

```sh
export NAMESPACE=<yournamespace>
oc process -n $NAMESPACE -f https://raw.githubusercontent.com/wiki/bcgov/nr-get-token/assets/templates/default.np.yaml | oc apply -n $NAMESPACE -f -
```

## Environment Setup - ConfigMaps and Secrets

There are some requirements in the target Openshift namespace/project which are **outside** of the CI/CD pipeline process. This application requires that a few Secrets as well as Config Maps are already present in the environment before it is able to function as intended. Otherwise the Jenkins pipeline will fail the deployment by design.

In order to prepare an environment, you will need to ensure that all of the following configmaps and secrets are populated. This is achieved by executing the following commands as a project administrator of the targeted environment. Note that this must be repeated on _each_ of the target deployment namespace/projects (i.e. `dev`, `test` and `prod`) as that they are independent of each other. Deployments will fail otherwise. Refer to [custom-environment-variables](../app/config/custom-environment-variables.json) for the direct mapping of environment variables to the app.

### Config Maps

_Note:_ Replace anything in angle brackets with the appropriate value!

_Note 2:_ The Keycloak Public Key can be found in the Keycloak Admin Panel under Realm Settings > Keys. Look for the Public key button (normally under RS256 row), and click to see the key. The key should begin with a pattern of `MIIBIjANB...`.

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>
export PUBLIC_KEY=<yourkeycloakpublickey>
export REPO_NAME=common-hosted-form-service
# parameters for Fluent-bit container
export FLUENTD=<yourfluentdendpoint>
export AWS_DEFAULT_REGION=<AWS region>
export AWS_KINESIS_STREAM=<AWS Kinesis stream name>
export AWS_ROLE_ARN=<AWS credential>

oc create -n $NAMESPACE configmap $APP_NAME-frontend-config \
  --from-literal=FRONTEND_APIPATH=api/v1 \
  --from-literal=VUE_APP_FRONTEND_BASEPATH=/app \
  --from-literal=FRONTEND_ENV=dev \
  --from-literal=FRONTEND_KC_REALM=cp1qly2d \
  --from-literal=FRONTEND_KC_SERVERURL=https://dev.oidc.gov.bc.ca/auth
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
  --from-literal=SERVER_KC_REALM=cp1qly2d \
  --from-literal=SERVER_KC_SERVERURL=https://dev.oidc.gov.bc.ca/auth \
  --from-literal=SERVER_LOGLEVEL=http \
  --from-literal=SERVER_PORT=8080
```

_Note:_ We use the NRS [Object Storage](https://github.com/bcgov/nr-get-token/wiki/Object-Storage) for CHEFS.

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
  --from-literal=FILES_OBJECTSTORAGE_BUCKET=egejyy \
  --from-literal=FILES_OBJECTSTORAGE_ENDPOINT=https://nrs.objectstore.gov.bc.ca \
  --from-literal=FILES_OBJECTSTORAGE_KEY=chefs/dev/ \
```

The following command creates an OpenShift config map that contains configuration files for our [Fluent-bit log forwarder](#sidecar-logging).

```sh
oc process -n $NAMESPACE -f fluent-bit.cm.yaml \
  -p NAMESPACE=$NAMESPACE \
  -p APP_NAME=$APP_NAME \
  -p REPO_NAME=$REPO_NAME \
  -p JOB_NAME=$JOB_NAME \
  -p FLUENTD=$FLUENTD \
  -p AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION \
  -p AWS_KINESIS_STREAM=$AWS_KINESIS_STREAM \
  -p AWS_ROLE_ARN=$AWS_ROLE_ARN \
  -o yaml | oc -n $NAMESPACE apply -f -
```

### Secrets

Replace anything in angle brackets with the appropriate value!

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

## Build Config & Deployment

This application is currently designed as a single application pod deployments. It will host a static frontend containing all of the Vue.js resources and assets, and a Node.js backend which serves the API that the frontend requires. We are currently leveraging Openshift Routes with path based filtering in order to forward incoming traffic to the right deployment service.

### Frontend

The frontend temporarily installs dependencies needed to generate the static assets that will appear in the `/app/frontend/dist` folder. These contents will be picked up by the application and hosted appropriately.

### Application

The backend is a standard [Node](https://nodejs.org)/[Express](https://expressjs.com) server. It handles the JWT based authentication via OIDC authentication flow, and exposes the API to authorized users. This deployment container is built up on top of an Alpine Node image. The resulting container after build is what is deployed.

## Templates

The Jenkins pipeline heavily leverages Openshift Templates in order to ensure that all of the environment variables, settings, and contexts are pushed to Openshift correctly. Files ending with `.bc.yaml` specify the build configurations, while files ending with `.dc.yaml` specify the components required for deployment.

### Build Configurations

Build configurations will emit and handle the chained builds or standard builds as necessary. They take in the following parameters:

| Name            | Required | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| REPO_NAME       | yes      | Application repository name                             |
| JOB_NAME        | yes      | Job identifier (i.e. 'pr-5' OR 'master')                |
| SOURCE_REPO_REF | yes      | Git Pull Request Reference (i.e. 'pull/CHANGE_ID/head') |
| SOURCE_REPO_URL | yes      | Git Repository URL                                      |

The template can be manually invoked and deployed via Openshift CLI. For example:

```sh
export NAMESPACE=<yournamespace>

oc process -n $NAMESPACE -f openshift/app.bc.yaml -p REPO_NAME=common-hosted-form-service
 -p JOB_NAME=master -p SOURCE_REPO_URL=https://github.com/bcgov/common-hosted-form-service.git -p SOURCE_REPO_REF=master -o yaml | oc apply -n $NAMESPACE -f -
```

Note that these build configurations do not have any triggers defined. They will be invoked by the Jenkins pipeline, started manually in the console, or by an equivalent oc command for example:

```sh
oc start-build -n $NAMESPACE <buildname> --follow
```

Finally, we generally tag the resultant image so that the deployment config will know which exact image to use. This is also handled by the Jenkins pipeline. The equivalent oc command for example is:

```sh
oc tag -n $NAMESPACE <buildname>:latest <buildname>:master
```

_Note: Remember to swap out the bracketed values with the appropriate values!_

### Deployment Configurations

Deployment configurations will emit and handle the deployment lifecycles of running containers based off of the previously built images. They generally contain a deploymentconfig, a service, and a route. Before our application is deployed, Patroni (a Highly Available Postgres Cluster implementation) needs to be deployed. Refer to any `patroni*` templates and their [official documentation](https://patroni.readthedocs.io/en/latest/) for more details.

Our application template take in the following parameters:

| Name       | Required | Description                                                         |
| ---------- | -------- | ------------------------------------------------------------------- |
| REPO_NAME  | yes      | Application repository name                                         |
| JOB_NAME   | yes      | Job identifier (i.e. 'pr-5' OR 'master')                            |
| NAMESPACE  | yes      | which namespace/"environment" are we deploying to? dev, test, prod? |
| APP_NAME   | yes      | short name for the application                                      |
| ROUTE_HOST | yes      | base domain for the publicly accessible URL                         |
| ROUTE_PATH | yes      | base path for the publicly accessible URL                           |

The Jenkins pipeline will handle deployment invocation automatically. However should you need to run it manually, you can do so with the following for example:

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

oc process -n $NAMESPACE -f openshift/app.dc.yaml -p REPO_NAME=common-hosted-form-service -p JOB_NAME=master -p NAMESPACE=$NAMESPACE -p APP_NAME=$APP_NAME -p ROUTE_HOST=$APP_NAME-dev.apps.silver.devops.gov.bc.ca -p ROUTE_PATH=master -o yaml | oc apply -n $NAMESPACE -f -
```

Due to the triggers that are set in the deploymentconfig, the deployment will begin automatically. However, you can deploy manually by use the following command for example:

```sh
oc rollout -n $NAMESPACE latest dc/<buildname>-master
```

_Note: Remember to swap out the bracketed values with the appropriate values!_

## Sidecar Logging

Our deployment on OpenShift uses a Fluent-bit sidecar to collect logs from the CHEFS application. The sidecar deployment is included in the main app.dc.yaml file.
Our NodeJS apps output logs to a configurable file path (for example app/app.log ). This is done using using a logger script. For example see our [CHEFS app logger](https://github.com/bcgov/common-hosted-form-service/blob/master/app/src/components/log.js)

The Fluent-bit configuration is kept in the openshift config map [fluent-bit.cm.yaml](/openshift/fluent-bit.cm.yaml)

Additional details for configuring the sidecar can be seen on the [wiki](https://github.com/bcgov/nr-get-token/wiki/Logging-to-a-Sidecar).

### Logs sent to AWS Opensearch

We currently forward our application logs from Fluent-bit to an AWS OpenSearch service.
the AWS connection credentials are found using environment variables in the fluent-bit container (aws credentials stored in 'chefs-aws-kinesis-secret' secret.)

to create this secret on OpenShift:

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

export username=<AWS access key ID>
export password=<AWS secret access key>

oc create -n $NAMESPACE secret generic $APP_NAME-aws-kinesis-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=$username \
  --from-literal=password=$password
```

The Fluent-bit configuration includes the output plugin 'kinesis streams' where we define our AWS region, arn_role and stream name.
A further parser for our logs was added to a node app running on an [AWS Lambda service](https://github.com/BCDevOps/nr-elasticsearch-stack/tree/master/event-stream-processing/src)

### Error Notifications

We currently also output logs to a Fluentd service where we can trigger error notifications to our Discord channel. See our [Wiki](https://github.com/bcgov/nr-get-token/wiki/Aggregate-logs-with-Fluentd) from more details.

## Pull Request Cleanup

As of this time, we do not automatically clean up resources generated by a Pull Request once it has been accepted and merged in. This is still a manual process. Our PR deployments are all named in the format "pr-###", where the ### is the number of the specific PR. In order to clear all resources for a specific PR, run the following two commands to delete all relevant resources from the Openshift project (replacing `PRNUMBER` with the appropriate number):

```sh
export NAMESPACE=<yournamespace>
export APP_NAME=<yourappshortname>

oc delete all,secret,pvc,networkpolicy,rolebinding -n $NAMESPACE --selector app=$APP_NAME-pr-<PRNUMBER>
oc delete all,svc,cm,sa,role,secret -n $NAMESPACE --selector cluster-name=pr-<PRNUMBER>
```

The first command will clear out all related executable resources for the application, while the second command will clear out the remaining Patroni cluster resources associated with that PR.

## Appendix - Supporting Deployments

There will be instances where this application will need supporting modifications or deployment such as databases and business analytics tools. Below is a list of initial reference points for other Openshift templates that could be leveraged and bolted onto the existing Jenkins pipeline if applicable.

### Metabase

- [Overview & Templates](https://github.com/bcgov/nr-get-token/wiki/Metabase)

### MongoDB

Refer to the `mongodb.dc.yaml` and `mongodb.secret.yaml` files found below for a simple persistent MongoDB deployment:

- [Templates](https://github.com/jujaga/common-hosted-form-service/tree/formio-mongodb/openshift)

### Patroni (HA Postgres)

Refer to the `patroni.dc.yaml` and `patroni.secret.yaml` files found below for a Highly Available Patroni cluster statefulset:

- [Templates](https://github.com/bcgov/nr-get-token/tree/master/openshift)

#### Database Backup

- [Documentation & Templates](https://github.com/bcgov/nr-get-token/wiki/Database-Backup)

After backups are made a verification job should be run to restore the backup into a temporary database and check that tables are created and data is written. This is not a full verification to ensure all data integrity, but it is an automatable first step.

Using the `backup-cronjon-verify.yaml` file from the `redash` directory:

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
    -p TAG_NAME=2.6.1 \
    | oc -n $NAMESPACE apply -f -
```

### Redis

Refer to the `redis.dc.yaml` and `redis.secret.yaml` files found below for a simple persistent Redis deployment:

- [Templates](https://github.com/bcgov/common-hosted-email-service/tree/master/openshift)
