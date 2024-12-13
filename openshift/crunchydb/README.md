# Fider

Fider uses CrunchyDB as its highly available database. CrunchyDB uses Patroni,
which uses PostgreSQL as the database.

## Installation

This CrunchyDB installation use the
[Helm chart](https://github.com/bcgov/crunchy-postgres) provided by the fine
folks over at platform services. The `charts` directory has been copied here
from commit `91d32cb` so that changes to the upstream repo don't unexpectedly
change our deployments. This stability and consistency comes at the cost of
added maintenance effort to stay in sync.
