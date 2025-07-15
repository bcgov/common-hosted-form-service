See https://github.com/bcgov/clamav - this is where it all started.

# CHEFS ClamAV Installation

This current documentation will be very simple and make assumptions:

- you are installing on BC Gov Openshift.
- you have installed `oc` command line tools on your workstation that work on BC Gov Openshift.
- you know how to get your Openshift token for running your `oc` command line tools.
- you have installed [helm](https://helm.sh) on your workstation.
- you have a basic understanding of helm and values files overrides.
- you have access/permissions in your Openshift namespace to run `helm` and `oc` commands.

## Basic Instructions

1. get your Openshift token
2. use oc login to your namespace
3. navigate to the `<repo>/clamav`
4. run the `helm` install / upgrade command

```
oc login --token=sha256~yk5BCjn0syJV0qXEyPk12s09v-RIdmTeLVdQmQrQEBc --server=https://api.silver.devops.gov.bc.ca:6443
helm upgrade --install chefs-clamav ./charts/clamav -f ./charts/clamav/values.yaml -f ./charts/clamav/values-dev.yaml
```

### To remove

1. get your Openshift token
2. use oc login to your namespace
3. run the `helm` uninstall command

```
oc login --token=sha256~yk5BCjn0syJV0qXEyPk12s09v-RIdmTeLVdQmQrQEBc --server=https://api.silver.devops.gov.bc.ca:6443
helm uninstall chefs-clamav
```

## Environment Specific

Each namespace and instance will have different resource allocation that we need to tune.
You can specify the '--values'/'-f' flag multiple times. The priority will be given to the last (right-most) file specified.
The values file is configured for productionl overrides exist for dev and test.

```
helm upgrade --install chefs-clamav ./charts/clamav -f ./charts/clamav/values.yaml -f ./charts/clamav/values-test.yaml
```

This would apply our default values file (`values.yaml`) with any overrides found in `values-test.yaml` taking priority.
