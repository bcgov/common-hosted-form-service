# Backup troubleshooting and operations

Notes for debugging and operating the Patroni/PostgreSQL backups (bcgov/backup-container) on OpenShift.

**Before running any commands:** switch to the target project so `oc` uses the correct namespace. Run `oc project` to see the current project, then `oc project <namespace>` to switch (e.g. `oc project a12c97-prod`).

## How backups are executed

- **CronJob:** `backup-postgres` runs on a schedule (e.g. `0 8 * * *` in prod = 08:00 UTC daily).
- **Command:** Each run executes `/backup.sh -1` (single backup cycle).
- **Strategy:** Rolling retention with:
  - **Daily** — Monday–Saturday → stored under `daily/YYYY-MM-DD`
  - **Weekly** — Sunday → stored under `weekly/YYYY-MM-DD`
  - **Monthly** — Last calendar day of month → stored under `monthly/YYYY-MM-DD`
- **Storage:** Backups are written to the PVC mounted at `/backups/` (e.g. `backup-a12c97-<env>`).
- **Config:** `backup-postgres-config` ConfigMap and `patroni-master-secret` (DB credentials).

To get a **weekly** or **monthly** backup on demand, run the same one-off job on a **Sunday** or on the **last day of the month**; the script classifies by date.

---

## One-off backup job (troubleshooting)

Run a single backup without waiting for the cron schedule. Use the same command in dev, test, or prod; only the namespace changes.

### Create the job

Switch to the target project first, then create the job:

| Environment | Namespace     | Commands                                                                                                          |
| ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dev**     | `a12c97-dev`  | `oc project a12c97-dev` then `oc create job troubleshoot-backup-1 --from=cronjob/backup-postgres -n a12c97-dev`   |
| **Test**    | `a12c97-test` | `oc project a12c97-test` then `oc create job troubleshoot-backup-1 --from=cronjob/backup-postgres -n a12c97-test` |
| **Prod**    | `a12c97-prod` | `oc project a12c97-prod` then `oc create job troubleshoot-backup-1 --from=cronjob/backup-postgres -n a12c97-prod` |

Replace `troubleshoot-backup-1` with any unique job name if you run multiple times (e.g. `troubleshoot-backup-2`).

### Watch and debug

```bash
# Set NAMESPACE to a12c97-dev, a12c97-test, or a12c97-prod
export NAMESPACE=a12c97-prod

oc get jobs -n $NAMESPACE
oc get pods -n $NAMESPACE -l job-name=troubleshoot-backup-1
oc logs -f job/troubleshoot-backup-1 -n $NAMESPACE
# Or by pod name:
oc logs -f <pod-name> -n $NAMESPACE

oc describe job troubleshoot-backup-1 -n $NAMESPACE
```

### Clean up the test job

```bash
oc delete job troubleshoot-backup-1 -n $NAMESPACE
```

---

## Mounting the backup PVC for review or pruning

To list backups, check sizes, or prune old backups manually, run a short-lived pod that mounts the backup PVC. Backups appear under `/mnt/daily/`, `/mnt/weekly/`, and `/mnt/monthly/`.

### Create the review pod

Use the helper YAML in this directory (replace `<env>` with the target environment):

| Environment | Namespace     | PVC name             | YAML file                                                    |
| ----------- | ------------- | -------------------- | ------------------------------------------------------------ |
| **Dev**     | `a12c97-dev`  | `backup-a12c97-dev`  | [backup-review-pod-dev.yaml](./backup-review-pod-dev.yaml)   |
| **Test**    | `a12c97-test` | `backup-a12c97-test` | [backup-review-pod-test.yaml](./backup-review-pod-test.yaml) |
| **Prod**    | `a12c97-prod` | `backup-a12c97-prod` | [backup-review-pod-prod.yaml](./backup-review-pod-prod.yaml) |

Example (prod): switch to the project first, then create the pod and rsh:

```bash
oc project a12c97-prod
oc apply -f tools/backup-review-pod-prod.yaml -n a12c97-prod
oc wait --for=condition=Ready pod/pvc-cleanup -n a12c97-prod --timeout=60s
oc rsh pvc-cleanup
```

**If `oc rsh pvc-cleanup` says pod not found:** run `oc project` to see which project you're in, then `oc project a12c97-prod` (or the target namespace) and try `oc rsh pvc-cleanup` again.

Inside the pod (the review pod uses UBI and does not have the backup script; use the commands below):

```bash
# List backup folders and sizes
du -h /mnt/daily /mnt/weekly /mnt/monthly
ls -la /mnt/daily /mnt/weekly /mnt/monthly

# Show actual backup files under each date folder (recursive listing)
ls -laR /mnt/daily /mnt/weekly /mnt/monthly

# Or list all backup files with sizes in a single view
find /mnt/daily /mnt/weekly /mnt/monthly -type f -exec ls -lh {} \;
```

### Example: prune to keep only recent backups

From inside the review pod (after `oc rsh pvc-cleanup -n <namespace>`), you can prune manually. Example: keep latest 6 daily, 1 weekly, 1 monthly.

**Dry run (see what would be removed):**

```bash
echo "Would REMOVE these daily (keeping 6 newest):"
ls -1 /mnt/daily/ | sort -r | tail -n +7

echo "Would REMOVE these weekly (keeping 1 newest):"
ls -1 /mnt/weekly/ | sort -r | tail -n +2

echo "Would REMOVE these monthly (keeping 1 newest):"
ls -1 /mnt/monthly/ | sort -r | tail -n +2
```

**Actually delete (run after verifying the list):**

```bash
for d in $(ls -1 /mnt/daily/ | sort -r | tail -n +7); do rm -rf "/mnt/daily/$d"; done
for d in $(ls -1 /mnt/weekly/ | sort -r | tail -n +2); do rm -rf "/mnt/weekly/$d"; done
for d in $(ls -1 /mnt/monthly/ | sort -r | tail -n +2); do rm -rf "/mnt/monthly/$d"; done
```

### Delete the review pod when done

```bash
oc delete pod pvc-cleanup -n $NAMESPACE
```

---

## Useful references

- [bcgov/backup-container](https://github.com/bcgov/backup-container) — backup script and rolling strategy
- CronJob runs `backup.sh -1`; retention is controlled by ConfigMap keys (e.g. `RETENTION.DAILY_BACKUPS`, `RETENTION.WEEKLY_BACKUPS`, `RETENTION.MONTHLY_BACKUPS`)
