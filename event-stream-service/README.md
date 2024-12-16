**not official documentation yet - just rough notes**

To use `natsbox` in the devcontainer:

- terminal into `natsbox`
- run `nats context add nats --server nats://n1:4222 --description "N1" --select`.

This will allow you to run `nats` command line commands against the local nats server.

Get information about the `CHEFS` stream:

- run `nats stream info CHEFS`
