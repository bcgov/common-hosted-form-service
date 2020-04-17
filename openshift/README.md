# Common Hosted Forms Service on Openshift

## MongoDB (Persistent, non-HA)

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f mongodb.secret.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
oc process -n $NAMESPACE -f mongodb.dc.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
```

## Formio

```sh
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f formio.bc.yaml -p REPO_NAME=forms-flow-ai -p JOB_NAME=jujaga -p SOURCE_REPO_REF=master -p SOURCE_REPO_URL=https://github.com/AOT-Technologies/forms-flow-ai -o yaml | oc apply -n $NAMESPACE -f -
```
