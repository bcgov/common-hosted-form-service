# Common Hosted Form Service on Openshift

Common Hosted Form Service currently consists of a MongoDB and the Form.io Enterprise application.

## Prerequesites
The instructions below assume you have created a scret called **formio-enterprise-license-secret** with a key called **LICENCE** that holds your fomrio enterprise licence key.

Note: the instructions below use APP_NAME (ex "mongodb"/"chefs"/etc) and INSTANCE (ex "master"/"pr-123"/etc) for the name of the deployments.

## MongoDB (Persistent, non-HA)

Run the following to stand up a Persistent, non HA instance of MongoDB.

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f mongodb.secret.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
oc process -n $NAMESPACE -f mongodb.dc.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
```

## Formio Enterprise

Run the following to stand up a non HA instance of Form.io Enterprise.

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>
export VERSION=6.10.5

oc process -n $NAMESPACE -f formio-enterprise.dc.yaml -p APP_NAME=$APP_NAME -p ROUTE_HOST=$APP_NAME-$INSTANCE-$NAMESPACE.pathfinder.gov.bc.ca -p JOB_NAME=$INSTANCE -p NAMESPACE=$NAMESPACE -p REPO_NAME=common-hosted-form-service -p VERSION=$VERSION -o yaml | oc apply -n $NAMESPACE -f -
```

## Formio (Unused)

These archival instructions reference forms-flow-ai specifically for standup and is currently unused.

```sh
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f unused/formio.bc.yaml -p REPO_NAME=forms-flow-ai -p JOB_NAME=jujaga -p SOURCE_REPO_REF=master -p SOURCE_REPO_URL=https://github.com/AOT-Technologies/forms-flow-ai -o yaml | oc apply -n $NAMESPACE -f -

oc process -n $NAMESPACE -f unused/formio.dc.yaml -p APP_NAME=chefs -p ROUTE_HOST=chefs-formio-jujaga.pathfinder.gov.bc.ca -p JOB_NAME=jujaga -p NAMESPACE=$NAMESPACE -p REPO_NAME=forms-flow-ai -o yaml | oc apply -n $NAMESPACE -f -
```
