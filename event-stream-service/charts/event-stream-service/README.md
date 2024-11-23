# Event Stream Service Installation

This current documentation will be very simple and make assumptions:

- you are installing on BC Gov Openshift.
- you have installed `oc` command line tools on your workstation that work on BC Gov Openshift.
- you know how to get your Openshift token for running your `oc` command line tools.
- you have installed [helm](https://helm.sh) on your workstation.
- you have a basic understanding of helm and values files overrides.
- you have access/permissions in your Openshift namespace to run `helm` and `oc` commands.

**September 3, 2024** - we are using the `a191b5` namespaces to host the proof of concepts. These spaces have minimal resources (we can request more as we learn about the requirements).

## Basic Instructions

1. get your Openshift token
2. use oc login to your namespace
3. navigate to the `<repo>/event-stream-service`
4. run the `helm` install / upgrade command

```
oc login --token=sha256~yk5BCjn0syJV0qXEyPk12s09v-RIdmTeLVdQmQrQEBc --server=https://api.silver.devops.gov.bc.ca:6443
helm upgrade --install event-stream-service ./charts/event-stream-service -f ./charts/event-stream-service/values.yaml
```

To set up a CHEFS instance to use this installation of Event Stream Service, you will need to know the server name and you will need the generated secret for the `chefs` account.

Find the `ess-nginx-route` and note the location. The Event Stream Service server will be the host (so no `https://` and no path).
Find the `ess-nats-auth` secret and copy the value for `chefs_pwd`.

### To remove

1. get your Openshift token
2. use oc login to your namespace
3. run the `helm` uninstall command
4. if wanting to do a clean install later, then run the `oc delete pvc` command to remove the persistent storage
5. if permanently deleting, then run the `oc delete secret` command to remove the secret

```
oc login --token=sha256~yk5BCjn0syJV0qXEyPk12s09v-RIdmTeLVdQmQrQEBc --server=https://api.silver.devops.gov.bc.ca:6443
helm uninstall event-stream-service
oc delete pvc -l 'app.kubernetes.io/instance=event-stream-service'
oc delete secret -l 'app.kubernetes.io/instance=event-stream-service'
```

## Future

We will need to create different param override (values) files for each instance. Each namespace and instance will have different resource allocation that we need to tune.
You can specify the '--values'/'-f' flag multiple times. The priority will be given to the last (right-most) file specified.

```
helm upgrade --install event-stream-service ./charts/event-stream-service -f ./charts/event-stream-service/values.yaml -f ./charts/event-stream-service/values-prod.yaml
```

This would apply our default values file (`values.yaml`) with any overrides found in `values-prod.yaml` taking priority.
