# CrunchyDB

CHEFS uses CrunchyDB for all of its highly available databases. CrunchyDB uses
Patroni for replication and failovers, and Patroni uses PostgreSQL as the
underlying database.

## Installation

The CrunchyDB installations use the
[Helm charts](https://github.com/bcgov/crunchy-postgres) provided by the fine
folks over at platform services. Huge thanks go to that team for doing the hard
work of figuring out the CrunchyDB setup and making it easier for the community
to use CrunchyDB.

The `charts` directory has been copied here so that changes to the upstream repo
don't unexpectedly change our deployments. This stability and consistency comes
at the cost of added maintenance effort to stay in sync.

This code is current to commit `91d32cb` in December 2024.
