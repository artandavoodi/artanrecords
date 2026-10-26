# Recording partnership pricing correction

## Error and ownership

The active implementation did not reverse shares: it omitted all defaults and
hard-coded a pending-only renderer. Studio subscription prices are a separate
software product, not Silver/Gold/Platinum economics. This directive does not
replace the separately approved subscription prices.

The sole default source is `docs/assets/data/partnerships.json`, commercial terms
version 1: Silver 85 artist / 15 label, Gold 80 / 20, Platinum 70 / 30.
`tools/ecosystem/partnerships.mjs` validates integer allocations totalling 100,
controls public reference rendering and distinguishes signed agreement values
from default references. No accounting calculations or historical mutations run.

## Publication gate

Commercial approval is recorded. Existing public presentation controls remain
`publication.percentages = false` and `publication.legalAccountingReview = pending`.
The supplied directive explicitly requires preserving this outstanding review.
To disclose percentages in rendered production pages, an authorized review must
set legalAccountingReview to approved and percentages to true, then rebuild,
test and synchronize all surfaces. Changing only percentages fails validation.
The default numbers are structured source data, not a personal agreement or
evidence of legal/accounting clearance. Public pages explain the pending review.

## Surface migration

- Website: source-driven financial rows and individual semantic tier text are
  prepared and tested under the approved publication configuration.
- Docs: the shared builder generates guidance from the same reference and gate,
  including recording scope, commerce exclusions and signed-agreement authority.
- Studio: Agreements distinguishes the default reference from actual signed
  terms; no signed financial record is invented or derived from a tier.
- Shared copies are checksum-governed mirrors, never independently edited terms.
- Store commissions and subscription checkout do not read recording allocations.
- Base distribution has no upfront fee for accepted standard releases, not zero
  total cost. Publishing and other income are not automatically covered.

## Tests and remaining work

Pricing tests assert exact defaults, total 100, invalid/negative/fractional
rejection, gated comparison and tier rendering, signed terms taking precedence,
and absence of recording fields in commerce configuration. General build checks
verify deterministic HTML, metadata and sitemap. Actual signed agreement intake,
financial reporting and public legal/accounting clearance remain separate gates.

Affected owners: partnerships.json; tools/site/partnerships.mjs;
tools/ecosystem/partnerships.mjs; tools/ecosystem/build.mjs;
tools/sync-surfaces.mjs; tools/test-partnerships.mjs; Studio agreements-render.mjs;
their generated pages, search indexes and foundation manifests. No old active
35/25 or reversed default allocation was found in the audited structured sources.
