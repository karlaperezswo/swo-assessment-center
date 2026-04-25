# Cloud Provider Logos

These SVGs are referenced by `frontend/src/components/shared/CloudIcon.tsx` and
the `CloudBrand` tokens in `frontend/src/theme/cloudBrand.ts`.

## CRITICAL: Replace placeholders with official logos before customer-facing release

The current SVGs in this directory are **placeholders**. Per the multi-cloud
plan's pre-requisites, before merging F6:

1. Validate with SoftwareOne legal/marketing that the partner programs in
   force cover use of each vendor's official logo in a commercial tool shown
   to customers (AWS Partner Network, Microsoft Solutions Partner, Google
   Cloud Partner Advantage, Oracle Partner Network).
2. Download the official logo SVGs from each vendor's brand center:
   - AWS: <https://aws.amazon.com/architecture/icons/>
   - GCP: <https://cloud.google.com/icons>
   - Azure: <https://learn.microsoft.com/en-us/azure/architecture/icons/>
   - Oracle: <https://www.oracle.com/legal/trademarks.html>
3. Replace `aws.svg`, `gcp.svg`, `azure.svg`, `oracle.svg` in this directory.
   Names and paths are the only contract — `CloudIcon` doesn't need code
   changes.
4. Respect each brand's guidelines: minimum size, no color modification,
   no rotation/cropping.

The placeholder SVGs are colored circles with the provider's initial so the UI
remains usable in development. They render at 16-24px in chips and ~32px in
tables.
