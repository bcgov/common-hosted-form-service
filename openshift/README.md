# Common Hosted Forms Service on Openshift

## MongoDB (Persistent, non-HA)

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f mongodb.secret.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
oc process -n $NAMESPACE -f mongodb.dc.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
```

## Formio Enterprise

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f formio-enterprise.dc.yaml -p APP_NAME=$APP_NAME -p ROUTE_HOST=$APP_NAME-$INSTANCE-$NAMESPACE.pathfinder.gov.bc.ca -p JOB_NAME=$INSTANCE -p NAMESPACE=$NAMESPACE -p REPO_NAME=common-hosted-form-service -o yaml | oc apply -n  -f -
```

## Formio (Unused)

These archival instructions reference forms-flow-ai specifically for standup and is currently unused.

```sh
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f unused/formio.bc.yaml -p REPO_NAME=forms-flow-ai -p JOB_NAME=jujaga -p SOURCE_REPO_REF=master -p SOURCE_REPO_URL=https://github.com/AOT-Technologies/forms-flow-ai -o yaml | oc apply -n $NAMESPACE -f -

oc process -n $NAMESPACE -f unused/formio.dc.yaml -p APP_NAME=chefs -p ROUTE_HOST=chefs-formio-jujaga.pathfinder.gov.bc.ca -p JOB_NAME=jujaga -p NAMESPACE=$NAMESPACE -p REPO_NAME=forms-flow-ai -o yaml | oc apply -n $NAMESPACE -f -
```
