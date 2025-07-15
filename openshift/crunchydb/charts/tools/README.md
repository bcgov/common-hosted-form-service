# Crunchy Postgres Tools chart

A chart to provision service accounts and networking templates to our namespaces.

This chart is meant to be deployed in all namespaces while using the `provisioner.namespace` value to conditionally deploy services in the correct namespaces.

## Included templates:

### Service accounts:

#### Deployer

A service account to be used to login to OpenShift and deploy your application in CI. This is deployed in all namespaces except for the tools/provisioner namespace.

| Parameter                         | Description                         | Default |
| --------------------------------- | ----------------------------------- | ------- |
| `deployer.serviceAccount.enabled` | Enable the deployer service account | `true`  |

---

#### Provisioner

A service account which is deployed to the tools namespace but the roles and rolebindings are deployed to all namespaces, giving the service account permissions to provision tools to all of the namespaces from the tools namespace.

| Parameter                        | Description                               | Default |
| -------------------------------- | ----------------------------------------- | ------- |
| `deployer.provisioner.enabled`   | Enable the provisioner service account    | `true`  |
| `deployer.provisioner.namespace` | The namespace the provisioner will run in | `true`  |

---

#### Linter

A service account deployed to the /tools namespace and used to login to OpenShift and verify Helm templates.

| Parameter                 | Description                       | Default |
| ------------------------- | --------------------------------- | ------- |
| `deployer.linter.enabled` | Enable the linter service account | `true`  |

---

### Networking

#### Namespace ingress network policy

Network policy to allow traffic from outside the namespace (like the internet) to access our pods

| Parameter                          | Description                       | Default |
| ---------------------------------- | --------------------------------- | ------- |
| `networking.networkPolicy.enabled` | Enable the ingress network policy | `true`  |

---

#### Pod ingress network policy

Pod network policy to allow pods to accept traffic from other pods in this namespace

| Parameter                             | Description                           | Default |
| ------------------------------------- | ------------------------------------- | ------- |
| `networking.podNetworkPolicy.enabled` | Enable the pod ingress network policy | `true`  |

---

#### Route

OpenShift route whitch allows you to host your application at a public URL.

| Parameter                  | Description                | Default |
| -------------------------- | -------------------------- | ------- |
| `networking.route.enabled` | Enable the OpenShift route | `true`  |
| `networking.route.host`    | The OpenShift route host   |         |

---

## Name overrides

| Parameter          | Description                                | Default                  |
| ------------------ | ------------------------------------------ | ------------------------ |
| `fullnameOverride` | Override release name                      | `crunchy-postgres-tools` |
| `deploymentName`   | The name of your dev/test/prod deployments | `crunchy-postgres`       |
