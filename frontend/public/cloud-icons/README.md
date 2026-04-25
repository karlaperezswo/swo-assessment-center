# Cloud Architecture Icons

Per-cloud iconsets used by `ArchitectureDiagram.tsx` and the multi-cloud
architecture comparison view via `frontend/src/diagram/iconMap.ts`.

## CRITICAL: Replace placeholders before customer-facing release

The current SVGs in this directory are **placeholders** — colored boxes with
the service name. Per the multi-cloud plan's pre-requisites, before merging F6:

1. Validate with SoftwareOne legal/marketing that partner programs cover use
   of each vendor's official architecture iconsets.
2. Download official iconsets from each vendor:
   - AWS: <https://aws.amazon.com/architecture/icons/>
   - GCP: <https://cloud.google.com/icons>
   - Azure: <https://learn.microsoft.com/en-us/azure/architecture/icons/>
   - Oracle: <https://docs.oracle.com/en/solutions/oci-best-practices-framework/index.html>
3. Replace the SVGs in `aws/`, `gcp/`, `azure/`, `oracle/` keeping the same
   filenames (the contract is the filename → see `iconMap.ts`).

Filenames per cloud (must match):

```
compute.svg
managed-db.svg
load-balancer.svg
object-storage.svg
block-storage.svg
queue.svg
cdn.svg
cache.svg
vpn.svg
dns.svg
secrets.svg
identity.svg
monitoring.svg
```

The iconMap.ts file in src/diagram/ references these by the generic-service
key — no code changes are needed when official icons land.
