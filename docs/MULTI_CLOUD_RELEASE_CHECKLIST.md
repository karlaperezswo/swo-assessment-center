# Multi-Cloud Release Checklist

This document tracks the **non-technical pre-requisites** that must be cleared
before SWO Assessment Center's multi-cloud comparator can be presented to
customers. The code is feature-complete (see `docs/MULTI_CLOUD_DELIVERY.md`
for the technical scope) but the items below are owned by SoftwareOne legal,
marketing, and partner-program teams.

## ⚠️ Blockers for customer-facing release

### 1. Official cloud provider logos

**Owner**: Marketing / Legal
**Bloqueante para**: customer-facing UI (chips header, agent drawer, badges)

The `frontend/public/cloud-logos/{aws,gcp,azure,oracle}.svg` files are
**placeholders** (colored circles with provider initials). Replace with
official SVGs from each vendor's brand center:

- AWS: <https://aws.amazon.com/architecture/icons/> (download "AWS Architecture Icons" asset package, use the wordmark)
- GCP: <https://cloud.google.com/icons> (Apache 2.0 with brand-guideline restrictions)
- Azure: <https://learn.microsoft.com/en-us/azure/architecture/icons/>
- Oracle: <https://www.oracle.com/legal/trademarks.html>

**Required validation before merge**: confirm with SoftwareOne legal/marketing
that the partner programs in force cover use of each vendor's official logo
in a commercial tool shown to customers:

- [ ] AWS Partner Network — Solutions Provider tier
- [ ] Microsoft Solutions Partner — Azure Infrastructure
- [ ] Google Cloud Partner Advantage — Premier or Sales Partner
- [ ] Oracle Partner Network — Oracle Cloud Infrastructure track

**No code change is required** when official logos land — `CloudIcon.tsx`
references the SVGs by filename. Just replace the files.

### 2. Official architecture iconsets

**Owner**: same as #1
**Bloqueante para**: `MultiCloudArchitecture.tsx` and per-cloud arch diagrams

The 52 SVGs in `frontend/public/cloud-icons/{aws,gcp,azure,oracle}/*.svg` are
**placeholders** (colored boxes with service abbreviations). Replace with the
official iconset of each vendor following the filename contract documented in
`frontend/public/cloud-icons/README.md` and `frontend/src/diagram/iconMap.ts`.

Required services per cloud (filename match required):

```
compute.svg        managed-db.svg       load-balancer.svg
object-storage.svg block-storage.svg    queue.svg
cdn.svg            cache.svg            vpn.svg
dns.svg            secrets.svg          identity.svg
monitoring.svg
```

Brand guidelines apply: minimum size, no color modification, no rotation/cropping.

### 3. Pricing catalog validation

**Owner**: Cloud architecture team (4 certified architects)
**Bloqueante para**: presenting numbers to customers

Hardcoded pricing tables for the three new clouds were sourced from public
list prices Q1 2026. They need formal sign-off before being shown to a paying
customer:

| Catalog                                                | Owner suggestion         | Status |
|--------------------------------------------------------|--------------------------|--------|
| `backend/src/data/pricing/aws/{compute,database}.ts`   | already calibrated       | ✅ baseline |
| `backend/src/data/pricing/gcp/{compute,database}.ts`   | GCP-certified architect  | ⏳ pending |
| `backend/src/data/pricing/azure/{compute,database}.ts` | Azure-certified architect| ⏳ pending |
| `backend/src/data/pricing/oracle/{compute,database}.ts`| OCI-certified architect  | ⏳ pending |

For each non-AWS catalog, an architect must verify:

- SKU specs (vCPU, memory) match the official offering
- On-demand pricing matches us-east / us-central1 / eastus / us-ashburn-1 list prices
- 1-year and 3-year commit prices reflect actual CUD/RI/Universal Credits rates
- Windows multipliers reflect current per-vCPU licensing premiums

### 4. Landing Zone catalog review

**Owner**: same as #3
**Bloqueante para**: showing checklist items as "production-ready"

All GCP/Azure/Oracle items in `shared/data/landingZoneSeeds.ts` are flagged
`experimental: true`. The UI displays a "borrador" (draft) badge on each item
until validation. The AWS catalog mirrors the calibrated baseline already in
production, so it is **not** flagged.

Per-cloud sign-off needed:

- [ ] GCP — Resource Hierarchy, Org Policies, Cloud Identity, Shared VPC, VPC-SC, Cloud Armor, Cloud Audit, Cloud Logging, Asset Inventory, SCC, CMEK, Binary Authorization, Budgets
- [ ] Azure — Tenant Root, Management Groups, Subscriptions, Azure Policy, Entra ID, RBAC + PIM, Conditional Access, Hub-and-Spoke, ExpressRoute, Azure Firewall, Front Door + WAF, Activity Log, Log Analytics, Diagnostic Settings, Defender for Cloud, Sentinel, Key Vault, Cost Management
- [ ] Oracle — Tenancy, Compartments, Quotas, Tag Namespaces, Identity Domains, IAM Policies, MFA, VCN, FastConnect, Network Firewall, OCI WAF, Audit, Logging, Service Connector Hub, Cloud Guard, Vault, VSS, Budgets

After sign-off, remove `experimental: true` from each item in
`shared/data/landingZoneSeeds.ts` (one source of truth — both backend and
frontend pick it up automatically).

### 5. Pricing refresh process

**Owner**: TBD (likely the same person who maintains the AWS catalog today)
**Bloqueante para**: long-term accuracy of estimates

The four pricing catalogs are hardcoded and will drift from vendor list prices
over time. Define and document the refresh cadence:

- [ ] Designate a quarterly review owner
- [ ] Create a calendar reminder (Q1, Q2, Q3, Q4)
- [ ] Document the refresh procedure (which docs to consult, how to validate, how to ship the bump as a PR)
- [ ] Consider migrating to JSON-external catalogs in `backend/src/data/pricing/*.json` to make refresh edits trivial

## 📋 Optional improvements (not blockers)

### 6. Per-cloud region pickers

The current `globalRegion` model is implicit (only AWS region is asked in the
form; other clouds use `defaultRegion`). For customers with strict locality
requirements, add a "Advanced" toggle in `ClientForm.tsx` that exposes a
per-cloud region dropdown.

### 7. Pricing API integration

The plan favored hardcoded pricing for v1. For v2, consider integrating each
vendor's pricing API as a fallback / refresh source:

- AWS Price List API
- GCP Billing API
- Azure Retail Prices API
- OCI Cost Estimator API

This would replace the quarterly manual refresh (item #5) with on-demand
pricing.

### 8. End-to-end smoke test in browser

There is no Playwright/Cypress test that exercises the full multi-cloud flow
(toggle CloudSelector → upload Excel → generate report → download docx with
section 8 → verify per-cloud columns in tables). The TypeScript and unit
tests cover correctness, but a UI smoke test would catch visual regressions.

## ✅ What's already done (technical scope)

For reference, the technical work that closed during the F1–F7 + Sprint 1–4
delivery is documented in:

- `docs/MULTI_CLOUD_DELIVERY.md` (overall scope)
- `/Users/yorkijr/.claude/plans/analiza-todas-las-funcionalidades-vast-planet.md`
  (the original approved plan)

Test scripts (all passing):

```bash
cd backend
npx ts-node src/cloud/__tests__/awsParity.test.ts            # 12/12 fixtures
npx ts-node src/cloud/__tests__/providerRecommend.test.ts    # 4 clouds × 10 fixtures + 14 discount cases
npx ts-node src/services/__tests__/multiCloudOrchestrator.test.ts  # 5 E2E cases
npx ts-node src/services/__tests__/docxService.snapshot.test.ts    # AWS-only stable + multi-cloud appended
```
