# Creator commerce: architecture and migration map

Audit date: 2026-10-25. Status: private authoring foundation; no commerce launch.
This replaces the obsolete single-repository proposal, not any working deployment.

## Audited owners

| Surface | Current owner | Current source and boundary |
| --- | --- | --- |
| artandavoodi.com | artandavoodi repository, docs/ | Artist identity, biography, music, release concepts, galleries, writing, concerts and public editorial data; deterministic static generation. |
| store.artandavoodi.com | artan-store repository, web/ and dist/ | Reference storefront; JSON-driven single-store catalogue and test-only server functions. Checkout is disabled in web/config.json. |
| artanrecords.com | artanrecords repository, docs/ | Label, approved creator snapshots, catalogue, institutional routes, metadata and legacy artist redirects. |
| studio.artanrecords.com | artanrecords-studio repository, app/ and content/ | Authenticated artist editing. It already uses the shared Store Supabase identity; frontend hosting is not a private database. |
| docs.artanrecords.com | independent artanrecords-docs repository | Public guidance; checksum-verified design distribution from Artanrecords. |
| control.artan.live | control-center repository | Staff oversight and scoped approvals; not a competing creator dashboard. |

The old /documentation, /studio and /shared directories remain preserved.
tools/independent-surface.mjs explicitly identifies the independent deployment
repositories. Do not move production back into the historical directories.

## Fixed direction

- Public profile: /{username}/.
- Public storefront fallback: /{username}/shop/.
- Product route: /{username}/shop/{slug}/.
- Creator commerce administration: Studio /store/.
- shop.artanrecords.com is a reserved future marketplace concept, not an assigned
  domain, an activated service or an administration surface.
- Artan Davoodi's approved public username is artandavoodi, without a dash.
  artan-davoodi remains a stable historical artist ID/legacy alias where already used.
- artandavoodi.com remains a public artist website. Do not move that entire
  experience into an authenticated dashboard.
- A custom profile host and a custom shop host are separate bindings to the same
  stable creator identity; a hostname must never create its own product database.

## Reference-to-destination migration map

| Existing concern | Preserve / learn | Target owner | Migration boundary |
| --- | --- | --- | --- |
| Artist biography, About and artistic voice | Preserve artist-specific content and editorial intent | Studio profile/content authoring; selected public snapshot | Existing artist fields remain authoritative until a field-by-field, consent-aware import is reviewed. No automatic legal-name or birth-date publication. |
| Releases, track credits, stories/concepts, lyrics, scores and performance assets | Preserve full metadata, artwork, stable IDs and rights distinctions | Studio release authoring with approved public catalogue export | Public catalogue currently contains static snapshots; private masters and paid scores must not be copied into public assets. |
| Photography, writing, works and collaborations | Preserve artist-specific collections and composition | Future creator works/content modules | Not falsely represented as implemented by adding a Store tab. Inventory every referenced asset before import. |
| Product cards, galleries, edition choices and collections | Learn presentation and interaction principles | Shared storefront renderer and Studio Store | Reuse approved tokens/primitives through their current owners; do not blindly clone portfolio or Store code. |
| web/catalogue.json, web/config.json and store_products/store_variants | Preserve existing product identity, availability, test pricing and media | One tenant-aware published catalogue after an approved migration | Today JSON presentation and database checkout data are separate sources. Reconcile them explicitly; never operate two independent live catalogues. |
| Private product/collection authoring | New, private by default | Studio Store backed by shared Supabase | studio_store_products and studio_store_collections are drafts, not a second operational catalogue or public API. Promotion into the published engine remains gated. |
| Orders, customers, addresses and downloads | Preserve records, existing identity and purchaser access | Shared private commerce backend; creator-scoped Studio administration | A customer account is not a creator-management grant. Existing purchaser RLS is not sufficient seller/tenant authorization. |
| Payment secrets, checkout, webhook signatures and download authorization | Preserve defensive principles, not the single-store assumptions | Provider adapter and trusted backend | Existing functions are origin/project-pinned, test-only and variant-based. Do not reuse them for multiple sellers unchanged. |
| Profile/store domain requests | New private requests, separate surfaces | Studio domain settings and verified backend resolver | A request does not prove DNS ownership, provision TLS or authorize a redirect. |
| Staff approval, verification and commerce entitlements | Preserve brand/tenant scoping | Control Center backed by server-side permission checks | A tier name, approved username or editable profile field must never grant selling or withdrawals. |
| Recording revenue and merchandise proceeds | Keep distinct | Separate agreement-scoped ledger categories | No recording percentage is inherited by commerce. No balances or commissions are simulated. |

## Identity and tenancy contracts

A stable creator UUID is separate from an Auth account ID, approved username,
domain and storefront UUID. The first authoring foundation maps one verified
owner account to one creator; role arrays permit multiple disciplines without
renaming the artist interface or migrating existing account IDs. Team delegation
is not enabled by the foundation.

A storefront references its creator. Products and collections reference both
through composite foreign keys. Products may reference only a collection in the
same store. Client writes cannot reassign owner/creator/store IDs. Optional
variants, product media, inventory policies, fulfillment strategy, release/preorder
information and tax classifications belong to a versioned product contract;
they do not activate inventory reservations, tax calculations or fulfillment.

The current Store remains unchanged. It becomes the reference tenant only after
a separately reviewed mapping of its existing products, customers, transactions,
assets and authenticated creator owner. No tenant-zero account is guessed from a
display name, email string or username, and no real tenant is seeded in tests.

## Public and private boundaries

New authoring tables have owner-only RLS and no anonymous grants. Public pages
must read an explicit, approved allowlist/snapshot, never the draft tables.
Private customer, order, agreement and financial records must stay out of
public JSON, GitHub Pages artifacts and catalogue responses.

Current public profile data lives in studio_artist_pages and is governed by the
existing username review and artist-selected visibility system. This proposal
does not bypass it. New commerce tables do not grant profile publication rights.

Product/store publication and capability grants are service-managed. Draft
creation does not make a product purchasable or a storefront public. Commercial
capabilities are independent of Silver, Gold and Platinum. A future grant needs
an explicit agreement reference and server-side authorization; the UI is not
the enforcement layer.

Important draft changes generate owner-readable audit records containing actor,
entity ID, action and time, without copying descriptions, customer information,
domain credentials or financial secrets into the log.

## Routes, hosting and domains

docs/assets/data/commerce.json owns route contracts, reserved future roots,
publication states and inactive activation flags. Existing generated institutional
reserved routes remain the collision authority; shop is added through that same
build, not through a second username registry.

GitHub Pages cannot turn a newly resolved dynamic creator/shop route into an
HTTP 200 using client JavaScript. README already documents this limitation.
Before public shops or broad creator-domain rollout, an approved server/edge
resolver must return real 200/404/503 responses, perform host-to-tenant lookup,
serve only approved publications and issue canonical/legacy redirects.
Do not label browser fallback rendering as complete SEO support.

Domain lifecycle: requested -> ownership verified -> TLS ready -> active.
Only a verified, TLS-ready binding can become primary. Verified hostnames are
globally unique, with one primary per creator/surface. Pending requests do not
reserve another creator's domain. Domain registrant, billing, renewal and
technical administrator responsibilities remain explicit agreements, not
assumptions inferred from a DNS request.

Keep the platform fallback address resolvable even after custom-domain activation.
Use an allowlisted stored binding, never an arbitrary Host header or user-entered
URL, to choose canonical redirects. Disconnecting a domain must restore fallback
operation; unknown hosts must not reveal a creator's private data.
DNS, certificate provisioning, arbitrary custom-host routing and registrar
automation are not activated by this iteration.

## Studio module structure

Store: Overview, Products, Collections, Domains, Finance.
The current foundation provides private authoring and honest connection status.
Orders, Inventory, Digital delivery, Shipping, Discounts and Reporting are future
modules, not disabled demonstrations with fabricated counts.

Profile domain requests and store domain requests use one creator-domain owner.
Profile information, releases, About and editorial content retain their existing
Studio owners; Store must not duplicate those editors.

## Funds flow and financial activation

Requested direction: customers pay the platform; approved commerce deductions
are recorded; creator payable amounts are settled after authorized withdrawal.
This is a requested business model, not an implemented merchant-of-record or
accounting determination.

Candidate technical flow: Stripe Connect separate charges and transfers.
A platform charge, transfer to a connected account, and bank payout are different
events. A withdrawal request must reserve an eligible payable balance and cannot
be paid twice. Reconciliation and verified provider events, not browser success
screens, must determine outcomes.

No live charges, bank onboarding, transfers, payouts, tax calculation, refund
processing, inventory reservations, revenue-share calculation or commission
defaults are enabled. Existing test-only checkout remains unchanged.

Activation requires: reviewed seller/merchant and tax responsibilities; executed
commerce terms and explicit share/expense definitions; Connect eligibility and
country support; verified seller onboarding; immutable order-line snapshots;
currency-safe, reconciled payable ledgers; signed/idempotent webhook handling;
refund/dispute/reversal policies; withdrawal limits and holding deadlines;
retention/privacy controls; scoped staff approval and audit; adversarial
cross-tenant tests; and a tested operational rollback.

Official technical references, checked 2026-10-25:
- https://docs.stripe.com/connect/separate-charges-and-transfers
- https://docs.stripe.com/connect/manual-payouts

Stripe distinguishes transfers from payouts and does not provide escrow;
manual payout timing is subject to country-specific limits. Legal/accounting
review is still required; these links do not approve the business model.

## Migration stages and acceptance

1. Audit and map: completed repository-level owner audit; visual parity still
   requires creator review on desktop, tablet and mobile.
2. Private foundation: additive draft tables, isolation tests, Studio authoring,
   capability contracts and profile/store domain requests. No existing service
   is removed or deactivated.
3. Reference import: explicitly verify Artan Davoodi's authenticated owner;
   reconcile existing product/variant IDs, availability, media and public copy.
   Preserve all records; compare against the reference store in staging.
4. Shared public engine: implement tenant-scoped publication, HTTP routing,
   server-rendered metadata, product visibility and canonical-host behavior.
5. Financial readiness: pass every financial activation gate above before
   introducing live money movement.
6. Custom-domain cutover: approve visual/accessibility/performance parity,
   back up data and routing, verify DNS ownership/TLS and rehearse rollback.
   Change store.artandavoodi.com only after explicit approval.
7. Retire the independent implementation: freeze it only after successful
   cutover and monitored validation; preserve history and restore capability.
   Never delete the shared Auth/backend merely because its repository is named Store.

## Explicitly deferred decisions

Provider/hosting purchase, DNS changes, public shop launch, custom-domain
verification infrastructure, team delegation, merchant-of-record, commerce
shares, fee/tax definitions, protected media migration, release-to-product
delivery, payable-ledger implementation and live withdrawals remain gated.
Neither Artan.com ownership nor a new Artana brand is required.
