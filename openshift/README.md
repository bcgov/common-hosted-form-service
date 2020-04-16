# Common Hosted Forms Service on Openshift

## MongoDB (Persistent, non-HA)

```sh
export APP_NAME=<appname>
export INSTANCE=<instance>
export NAMESPACE=<namespace>

oc process -n $NAMESPACE -f mongodb.secret.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
oc process -n $NAMESPACE -f mongodb.dc.yaml -p APP_NAME=$APP_NAME -p INSTANCE=$INSTANCE -o yaml | oc apply -n $NAMESPACE -f -
```
