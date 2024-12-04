# Fider

Fider uses CrunchyDB as its highly available database. CrunchyDB uses Patroni,
which uses PostgreSQL as the database.

## Installation

CrunchyDB is installed using the
[Helm chart](https://github.com/bcgov/crunchy-postgres) provided by the fine
folks over at platform services. Clone this repo.

> TBD: should we make a copy of it in our repo, so that a recreate uses the same
> charts? Probably.

```sh
export HELM_CHART_DIR=<your dir>
$ helm -n a12c97-tools upgrade --install crunchy-tools-fider $HELM_CHART_DIR/charts/tools -f values-tools-fider.yaml
$ helm -n a12c97-tools upgrade --install crunchy-postgres-fider $HELM_CHART_DIR/charts/crunchy-postgres -f values-crunchy-postgres-fider.yaml
```
