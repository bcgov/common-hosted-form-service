**not official documentation yet - just rough notes**

To use `natsbox` in the devcontainer:

In one terminal (project root):

- run `docker compose -f .devcontainer/chefs_local/docker-compose.yml up`

Start natsbox and login

- terminal into `natsbox`
- Under Docker tab, right click natsio/nats-box:latest and "Attach Shell"
- run `nats context add admin --server nats://n1:4222 --description "admin" --user=admin --password=password --select`.

This will allow you to run `nats` command line commands against the local nats server.

Get information about the `CHEFS` stream:

- run `nats stream info CHEFS`
- run `nats s report`

- run `exit` to leave shell
