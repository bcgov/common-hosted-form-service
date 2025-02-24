# CHEFS - ESS Authorizations

Reading:

- [NATS Authorization](https://docs.nats.io/running-a-nats-service/configuration/securing_nats/auth_intro#authorization-map)
- [NKeys](https://docs.nats.io/running-a-nats-service/configuration/securing_nats/auth_intro/nkey_auth)

To allow a new CHEFS User/Organization/Initiative to use ESS, we need to create an authorization in NATS. For this, we use `nkeys`, which requires the [nk tool](https://docs.nats.io/using-nats/nats-tools/nk).

Instead of installing this on your machine, create and run a Docker image using [Dockerfile](./Dockerfile).

Once created, we will generate a new nkey (user + seed) and that user needs to be added to the ESS authorizations with CHEFS consumer permissions.

The authorizations are added to the ESS/NATS configuration file via Helm charts. Then we need to publish the charts to each environment.

## Build and run Dockerfile

This assumes you have [docker](https://www.docker.com/) installed on your system, or you are doing this in the `devcontainer`.

### Build

This will build an GO image with the [nk tool](https://docs.nats.io/using-nats/nats-tools/nk) installed.

```
cd event-stream-service/authorizations/
docker build --pull --rm -f 'Dockerfile' -t 'docker-nk:latest' .
```

### Run

The following command will run the image, which simply calls `nk -gen user -pubout` to generate user/seed pair.

```
docker run --rm -it docker-nk:latest

# outputs the Seed and User values, copy these!
SUAJ37KICJLVOMTBVEM4YNSPWYWRGOQNURSJEP4HIVCMNENNDA6OQWNUXE
UDG2NKMXL4WRBKPWA2CYJKH5HYCHPM2VIACHAKQBTABTS72E7ZKJDEYH
```

Copy both values, `U` is the public user name, `S` is the private key/seed.

## Update authorization configuration

The `U` value (public user name), is added to the Helm charts [authorizations file](../charts/event-stream-service/authorizations.yaml).

Open [authorizations file](../charts/event-stream-service/authorizations.yaml) and add the new nkey to the users list.

```
nats:
  config:
    merge:
      authorization:
        users:
          - nkey: "UDG2NKMXL4WRBKPWA2CYJKH5HYCHPM2VIACHAKQBTABTS72E7ZKJDEYH" # CHEFS read-only, demo.
            permissions:
              publish:
                [
                  "SANDBOX.*",
                  "$JS.API.INFO",
                  "$JS.API.CONSUMER.CREATE.CHEFS",
                  "$JS.API.CONSUMER.CREATE.CHEFS.>",
                  "$JS.API.CONSUMER.DURABLE.CREATE.CHEFS.>",
                  "$JS.API.CONSUMER.DELETE.CHEFS.>",
                  "$JS.API.CONSUMER.INFO.CHEFS.>",
                  "$JS.API.CONSUMER.LIST.CHEFS",
                  "$JS.API.CONSUMER.NAMES.CHEFS",
                  "$JS.API.CONSUMER.MSG.NEXT.CHEFS.>",
                  "$JS.API.CONSUMER.MSG.NEXT.CHEFS.NEW",
                  "$JS.API.STREAM.MSG.GET.CHEFS",
                  "$JS.API.STREAM.INFO.CHEFS",
                  "$JS.API.STREAM.LIST",
                  "$JS.API.STREAM.NAMES",
                  "$JS.ACK.CHEFS",
                  "$JS.ACK.CHEFS.>",
                ]
              subscribe: ["PUBLIC.forms.>", "PRIVATE.forms.>", "_INBOX.>"]
```

Save the changes.

## Publish updated Helm charts

Once we have added the nkey to NATS authorization configuration, we need to push the changes to each environment/instance. Please follow the instructions in the main [README](../README.md) on how to run the Helm charts.

## Add the User to CHEFs

### Dev and Test environments

For the initial rollout, we will need to manually add a record to the `ess_allowlist` table. Do this with whatever process works for you; generally port forwarding and using your preferred local DB IDE. You will need the username/password from the db secret for whichever environment you need to update. This should only be done for `dev` and `test`, accounts should be added to production through data migrations.

```
# get your oc token
# port forward
oc -n <NAMESPACE> port-forward patroni-master-0 15432:5432
# connect with appropriate username/password
# add record to table.
insert into ess_allowlist ("accountName", notes, "createdBy")
values ('UDG2NKMXL4WRBKPWA2CYJKH5HYCHPM2VIACHAKQBTABTS72E7ZKJDEYH','{ "msg": "some notes about why this is created and allowed" }','yourname');
```

### Production via Data Migration

Once an account has been approved for `production`, we need to create a data migration script. This allows the account to exist through rollbacks and disaster recovery.

We need to do a data migration to add the new User to `ess_allowlist`. Make sure to include some context in the notes as to who and why this User was created. Perhaps include a submission confirmation id.

This example adds 2 new accounts. If the accounts already exist in an environment (ex. `dev`, `test`) then the accounts will not be added.

```
const CREATED_BY = '<a unique stamp for this migration script>';

const ACCOUNT_ONE = 'UCT3KJ7BCOK3ZH5KSAJTHL3WRB5CX2MJ2XMKX2R7FRZUAUYC427TGESZ';
const ACCOUNT_TWO = 'UDG2NKMXL4WRBKPWA2CYJKH5HYCHPM2VIACHAKQBTABTS72E7ZKJDEYH';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return Promise.resolve()
    .then(() => {
      return knex('ess_allowlist').where('accountName', ACCOUNT_ONE).first();
    })
    .then((rec) => {
      if (!rec) {
        let rec = {
          accountName: ACCOUNT_ONE,
          notes: { msg: 'Add some context for who asked for this and maybe how the request was made.' },
          createdBy: CREATED_BY,
        };
        return knex('ess_allowlist').insert(rec);
      }
    })
    .then(() => {
      return knex('ess_allowlist').where('accountName', ACCOUNT_TWO).first();
    })
    .then((rec) => {
      if (!rec) {
        let rec = {
          accountName: ACCOUNT_TWO,
          notes: { msg: 'Maybe we can add a submission confirmation id here too.' },
          createdBy: CREATED_BY,
        };
        return knex('ess_allowlist').insert(rec);
      }
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex('ess_allowlist')
      .where({
        createdBy: CREATED_BY,
      })
      .del()
  );
};

```

Commit and create a Pull request and this account will be included in the allowed list.

## Notify the requestor!

When we have created the new authorization and pushed it to our namespaces, contact the initial requesting user (and whomever they have designated) with the nkey information. They should recieve both the `U` and `S` nkey pair values, as well as ESS environment configuration for the instances that include the new authorization.

We must not save the `S` value in any location, we only need to retain the `U` value. Only the requestor needs the `S` value.
