#!/bin/sh
set -e

# Stream clamd/freshclam log files to stdout so they still show up in `oc logs`,
# since writing directly to /dev/stdout crashes clamd (see clamd.conf).
tail -F /var/log/clamav/clamav.log /var/log/clamav/freshclam.log &

# Prefer Helm-mounted configs when present; fallback to image defaults for local runs.
CLAMD_CONF=/etc/clamd.conf
FRESHCLAM_CONF=/etc/freshclam.conf
[ -f "$CLAMD_CONF" ] || CLAMD_CONF=/usr/local/etc/clamd.conf
[ -f "$FRESHCLAM_CONF" ] || FRESHCLAM_CONF=/usr/local/etc/freshclam.conf

freshclam --config-file="$FRESHCLAM_CONF"
exec clamd --config-file="$CLAMD_CONF"
