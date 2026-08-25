#!/bin/sh
set -e

# Stream clamd/freshclam log files to stdout so they still show up in `oc logs`,
# since writing directly to /dev/stdout crashes clamd (see clamd.conf).
tail -F /var/log/clamav/clamav.log /var/log/clamav/freshclam.log &

freshclam
exec clamd
